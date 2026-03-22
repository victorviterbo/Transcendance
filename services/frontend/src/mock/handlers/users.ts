import { http, HttpResponse } from "msw";
import { checkEmailValid, checkPasswordValid, checkUsernameValid } from "../../utils/enforcement";
import { db, normalizeEmail, normalizeUsername, type MockUser } from "../db";
import { API_PROFILE, API_PROFILE_SEARCH } from "../../constants";

type ProfilePayload = {
	username?: unknown;
	email?: unknown;
	image?: unknown;
	currentPassword?: unknown;
	newPassword?: unknown;
};

const unauthorized = () => HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
const DEFAULT_PROFILE_IMAGE = "/DB/media/default_pp.jpg";

const toProfileResponse = (user: MockUser) => ({
	username: user.username,
	image: DEFAULT_PROFILE_IMAGE,
	exp_points: user.expPoints,
	badges: user.badges,
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
		image?: string | null;
	} = {};
	const errors: Record<string, string> = {};
	let nextPassword: string | null = null;

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

	if (
		typeof payload.currentPassword === "string" ||
		typeof payload.newPassword === "string"
	) {
		const currentPassword =
			typeof payload.currentPassword === "string" ? payload.currentPassword : "";
		const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

		if (currentPassword.length === 0) {
			errors.currentPassword = "MISSING_FIELD";
		} else if (sessionUser.password !== currentPassword) {
			errors.currentPassword = "INVALID_PASSWORD";
		}

		if (newPassword.length === 0) {
			errors.newPassword = "MISSING_FIELD";
		} else {
			const passwordErrors = checkPasswordValid(newPassword);
			if (passwordErrors.length > 0) {
				errors.newPassword = passwordErrors[0];
			} else {
				nextPassword = newPassword;
			}
		}
	}

	if (Object.keys(errors).length > 0) {
		return HttpResponse.json({ error: errors }, { status: 400 });
	}

	const updated = db.updateUser(sessionUser.username, updates);
	if (!updated) {
		return HttpResponse.json({ error: "Unauthorized: profile unavailable" }, { status: 401 });
	}

	if (nextPassword) {
		const passwordUpdated = db.updatePassword(updated.username, sessionUser.password, nextPassword);
		if (!passwordUpdated) {
			return HttpResponse.json({ error: { currentPassword: "INVALID_PASSWORD" } }, { status: 400 });
		}
	}

	return HttpResponse.json(toProfileResponse(updated), { status: 200 });
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
				image: DEFAULT_PROFILE_IMAGE,
				is_guest: user.isGuest ?? false,
				session_key: user.sessionKey ?? null,
			},
		],
		{ status: 200 },
	);
});
