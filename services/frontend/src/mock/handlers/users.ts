import { http, HttpResponse } from "msw";
import { db, normalizeUsername } from "../db";
import { API_PROFILE, API_PROFILE_SEARCH } from "../../constants";

type ProfilePayload = {
	username?: unknown;
	image?: unknown;
};

const unauthorized = () => HttpResponse.json({ error: "Unauthorized" }, { status: 401 });

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

	return HttpResponse.json(
		{
			username: user.username,
			image: user.image ?? "/DB/media/default_pp.jpg",
			exp_points: user.expPoints,
			badges: user.badges,
			email: db.findUserByUsername(user.username)?.email,
			created_at: new Date().toISOString(),
		},
		{ status: 200 },
	);
});

export const PatchMeHandler = http.post(API_PROFILE, async ({ request }) => {
	const sessionUser = db.getSessionUser();
	if (!sessionUser) return unauthorized();

	const payload = (await readProfilePayload(request)) as ProfilePayload;
	const updates: {
		username?: string;
		image?: string | null;
	} = {};
	const errors: Record<string, string> = {};

	if (typeof payload.username === "string") {
		const username = payload.username.trim();
		if (username.length === 0) {
			errors.username = "MISSING_FIELD";
		} else if (
			username.includes("..") ||
			username.includes("/") ||
			username.includes("\\") ||
			username.includes("~")
		) {
			errors.username = "INVALID_USERNAME";
		} else {
			updates.username = normalizeUsername(username);
		}
	}

	if (typeof payload.image === "string") {
		updates.image = payload.image.trim().length > 0 ? payload.image.trim() : null;
	}

	if (Object.keys(errors).length > 0) {
		return HttpResponse.json({ error: errors }, { status: 400 });
	}

	const updated = db.updateUser(sessionUser.username, updates);
	if (!updated) {
		return HttpResponse.json({ errror: "Unauthorized: profile unavailable" }, { status: 401 });
	}

	return HttpResponse.json({ description: "Updated Profile successfully" }, { status: 200 });
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
				image: user.image ?? "/DB/media/default_pp.jpg",
				is_guest: user.isGuest ?? false,
				session_key: user.sessionKey ?? null,
			},
		],
		{ status: 200 },
	);
});
