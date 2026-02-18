import { http, HttpResponse } from "msw";
import type { IAuthUser } from "../../types/user";
import {
	API_AUTH_LOGIN,
	API_AUTH_LOGOUT,
	API_AUTH_REFRESH,
	API_AUTH_REGISTER,
} from "../../constants";
import { db, normalizeEmail, normalizeUsername } from "../db";

type AuthPayload = Partial<IAuthUser> & { password?: string };

let sessionUser: { username: string } | null = null;
const SESSION_STORAGE_KEY = "mock-auth-session";

/**
 * @brief Read the persisted mock session username from localStorage.
 * @returns The stored username or null when missing/unavailable.
 */
const readSession = () => {
	if (typeof localStorage === "undefined") return null;
	const raw = localStorage.getItem(SESSION_STORAGE_KEY);
	if (!raw) return null;
	try {
		const data = JSON.parse(raw) as { username?: string };
		return typeof data?.username === "string" && data.username.length > 0
			? data.username
			: null;
	} catch {
		return null;
	}
};

/**
 * @brief Persist or clear the mock session username in localStorage.
 * @param username The username to store, or null to clear.
 */
const writeSession = (username: string | null) => {
	if (typeof localStorage === "undefined") return;
	if (!username) {
		localStorage.removeItem(SESSION_STORAGE_KEY);
		return;
	}
	localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ username }));
};

/**
 * @brief Create a mock access token string.
 * @returns A pseudo-random token.
 */
const makeAccessToken = () =>
	`mock-access-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * @brief Handle mock login.
 * @param request MSW request containing email/password JSON payload.
 * @returns Access token and username on success, 401 on failure.
 */
export const LoginHandler = http.post(API_AUTH_LOGIN, async ({ request }) => {
	const payload = (await request.json()) as AuthPayload;
	const email = payload.email ?? "";
	const password = payload.password ?? "";

	const user = db.authenticate(email, password);
	if (user) {
		sessionUser = { username: user.username };
		writeSession(user.username);
		return HttpResponse.json(
			{
				access: makeAccessToken(),
				username: user.username,
			},
			{ status: 200 },
		);
	}
	return HttpResponse.json({ error: "Wrong email or password" }, { status: 401 });
});

/**
 * @brief Handle mock registration.
 * @param request MSW request containing username/email/password JSON payload.
 * @returns Access token and username on success, 409 on conflict.
 */
export const RegisterHandler = http.post(API_AUTH_REGISTER, async ({ request }) => {
	const payload = (await request.json()) as AuthPayload;
	const username = payload.username ?? "";
	const email = payload.email ?? "";

	if (
		db.findUserByUsername(normalizeUsername(username)) &&
		db.findUserByEmail(normalizeEmail(email))
	)
		return HttpResponse.json(
			{
				error: {
					username: "Username already taken",
					email: "Email already taken",
				},
			},
			{ status: 409 },
		);

	if (db.findUserByUsername(normalizeUsername(username)))
		return HttpResponse.json(
			{
				error: "Username already taken",
				field: username,
			},
			{ status: 409 },
		);

	if (db.findUserByEmail(normalizeEmail(email)))
		return HttpResponse.json(
			{
				error: "Email already taken",
				field: email,
			},
			{ status: 409 },
		);

	const user = db.createUser(username, email, payload.password ?? "");
	sessionUser = { username: user.username };
	writeSession(user.username);
	return HttpResponse.json(
		{
			access: makeAccessToken(),
			username: user.username,
		},
		{ status: 200 },
	);
});

/**
 * @brief Handle mock refresh.
 * @returns New access token if a mock session exists, 401 otherwise.
 */
export const RefreshHandler = http.post(API_AUTH_REFRESH, async () => {
	if (!sessionUser) {
		const persistedUsername = readSession();
		if (!persistedUsername) {
			return HttpResponse.json({ error: "Refresh token expired" }, { status: 401 });
		}
		sessionUser = { username: persistedUsername };
	}
	return HttpResponse.json({ access: makeAccessToken(), username: sessionUser.username });
});

/**
 * @brief Handle mock logout.
 * @returns 204 response and clears mock session.
 */
export const LogoutHandler = http.post(API_AUTH_LOGOUT, async () => {
	sessionUser = null;
	writeSession(null);
	return new HttpResponse(null, {
		status: 204,
	});
});
