import { http, HttpResponse } from "msw";
import { checkEmailValid, checkPasswordValid, checkUsernameValid } from "../../utils/enforcement";
import { db, getBadgeForXp, normalizeEmail, normalizeUsername, type MockUser } from "../db";
import { API_PROFILE, API_PROFILE_PASSWORD, API_PROFILE_SEARCH } from "../../constants";

type ProfilePayload = {
	username?: unknown;
	email?: unknown;
	avatar?: unknown;
	password?: unknown;
};

type PasswordPayload = {
	currentPassword?: unknown;
	newPassword?: unknown;
};

const unauthorized = () => HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
const DEFAULT_PROFILE_AVATAR = "/DB/media/default_pp.jpg";

const toProfileResponse = (user: MockUser) => ({
	username: user.username,
	avatar: user.avatar ?? DEFAULT_PROFILE_AVATAR,
	exp_points: user.expPoints,
	badges: getBadgeForXp(user.expPoints),
	created_at: new Date().toISOString(),
	email: user.email,
});

const readProfilePayload = async (request: Request): Promise<Record<string, unknown>> => {
	const contentType = request.headers.get("content-type") ?? "";
	try {
		if (contentType.includes("multipart/form-data")) {
			const formData = await request.formData();
			const payload: Record<string, unknown> = {};
			for (const [key, value] of formData.entries()) {
				payload[key] = value;
			}
			return payload;
		}

		const raw = await request.json();
		return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
	} catch {
		return {};
	}
};

export const GetMeHandler = http.get(API_PROFILE, ({ request }) => {
	const url = new URL(request.url);
	const query = url.searchParams.get("q");

	if (query === null) {
		return HttpResponse.json({ error: "Query string not found" }, { status: 400 });
	}
	if (query.length === 0) {
		return HttpResponse.json({ error: "Invalid empty query string" }, { status: 400 });
	}

	const user = db.findUserByExactUsername(query);
	if (!user) {
		return HttpResponse.json({ error: "No profile with this username" }, { status: 400 });
	}

	return HttpResponse.json(toProfileResponse(user), { status: 200 });
});

export const PatchMeHandler = http.post(API_PROFILE, async ({ request }) => {
	const sessionUser = db.getSessionUser();
	if (!sessionUser) return unauthorized();

	const payload = (await readProfilePayload(request)) as ProfilePayload;
	const updates: {
		username?: string;
		email?: string;
		avatar?: string | null;
	} = {};
	const errors: Record<string, string> = {};

	if (typeof payload.username === "string") {
		const username = payload.username.trim();
		if (username.length === 0) {
			errors.username = "MISSING_FIELD";
		} else {
			const usernameErrors = checkUsernameValid(username);
			if (usernameErrors.length > 0) {
				errors.username = usernameErrors[0];
			} else {
				const normalizedUsername = normalizeUsername(username);
				const existingUser = db.findUserByUsername(normalizedUsername);
				if (existingUser && existingUser.username !== sessionUser.username) {
					errors.username = "USERNAME_TAKEN";
				} else {
					updates.username = normalizedUsername;
				}
			}
		}
	}

	if (typeof payload.email === "string") {
		const email = payload.email.trim();
		if (email.length === 0) {
			errors.email = "MISSING_FIELD";
		} else {
			const emailErrors = checkEmailValid(email);
			if (emailErrors.length > 0) {
				errors.email = emailErrors[0] === "EMAIL_VALID" ? "INVALID_EMAIL" : emailErrors[0];
			} else {
				const normalizedEmail = normalizeEmail(email);
				const existingUser = db.findUserByEmail(normalizedEmail);
				if (existingUser && existingUser.username !== sessionUser.username) {
					errors.email = "EMAIL_TAKEN";
				} else {
					updates.email = normalizedEmail;
				}
			}
		}
	}

	if (payload.avatar instanceof File) {
		updates.avatar = DEFAULT_PROFILE_AVATAR;
	} else if (typeof payload.avatar === "string") {
		const avatar = payload.avatar.trim();
		updates.avatar = avatar.length > 0 ? avatar : null;
	}

	if (Object.keys(errors).length > 0) {
		return HttpResponse.json({ error: errors }, { status: 400 });
	}

	const updated = db.updateUser(sessionUser.username, updates);
	if (!updated) {
		return HttpResponse.json({ error: "Unauthorized: profile unavailable" }, { status: 401 });
	}

	return HttpResponse.json(toProfileResponse(updated), { status: 200 });
});

export const ChangePasswordHandler = http.post(API_PROFILE_PASSWORD, async ({ request }) => {
	const sessionUser = db.getSessionUser();
	if (!sessionUser) return unauthorized();

	const payload = (await readProfilePayload(request)) as PasswordPayload;
	const currentPassword =
		typeof payload.currentPassword === "string" ? payload.currentPassword : "";
	const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";
	const errors: Record<string, string> = {};

	if (currentPassword.length === 0) {
		errors.currentPassword = "MISSING_FIELD";
	} else if (sessionUser.password !== currentPassword) {
		errors.currentPassword = "INVALID_PASSWORD";
	}

	if (newPassword.length === 0) {
		errors.newPassword = "MISSING_FIELD";
	} else if (newPassword === currentPassword) {
		errors.newPassword = "PASSWORD_UNCHANGED";
	} else {
		const passwordErrors = checkPasswordValid(newPassword);
		if (passwordErrors.length > 0) {
			errors.newPassword = passwordErrors[0];
		}
	}

	if (Object.keys(errors).length > 0) {
		return HttpResponse.json({ error: errors }, { status: 400 });
	}

	const updated = db.updatePassword(sessionUser.username, currentPassword, newPassword);
	if (!updated) {
		return HttpResponse.json(
			{ error: { currentPassword: "INVALID_PASSWORD" } },
			{ status: 400 },
		);
	}

	return HttpResponse.json({ description: "PASSWORD_UPDATED" }, { status: 200 });
});

export const DeleteProfileHandler = http.delete(API_PROFILE, async ({ request }) => {
	const sessionUser = db.getSessionUser();
	if (!sessionUser) return unauthorized();

	const payload = (await readProfilePayload(request)) as ProfilePayload;
	const password = typeof payload.password === "string" ? payload.password : "";

	if (password.length === 0) {
		return HttpResponse.json({ error: { password: "MISSING_FIELD" } }, { status: 400 });
	}

	if (sessionUser.password !== password) {
		return HttpResponse.json({ error: { password: "INVALID_PASSWORD" } }, { status: 400 });
	}

	db.deleteUser(sessionUser.username);
	return new HttpResponse(null, { status: 204 });
});

export const ProfileSearchHandler = http.get(API_PROFILE_SEARCH, ({ request }) => {
	const url = new URL(request.url);
	const query = url.searchParams.get("q");

	if (query === null) {
		return HttpResponse.json({ error: "no search query sent" }, { status: 400 });
	}
	if (query.length === 0) {
		return HttpResponse.json([], { status: 200 });
	}

	const user = db.findUserByExactUsername(query);
	if (!user) return HttpResponse.json([], { status: 200 });

	return HttpResponse.json(
		[
			{
				username: user.username,
				avatar: user.avatar ?? DEFAULT_PROFILE_AVATAR,
				is_guest: user.isGuest ?? false,
				session_key: user.sessionKey ?? null,
			},
		],
		{ status: 200 },
	);
});
