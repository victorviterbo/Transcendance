import { http, HttpResponse } from "msw";
import type { IAuthUser } from "../../types/user";
import {
	API_AUTH_LOGIN,
	API_AUTH_LOGOUT,
	API_AUTH_REFRESH,
	API_AUTH_REGISTER,
} from "../../constants";

type AuthPayload = Partial<IAuthUser> & { password?: string };

const KNOWN_USER: IAuthUser & { email: string; password: string } = {
	id: 1,
	username: "john",
	email: "john@42.fr",
	password: "secret",
};

const normalize = (value: string) => value.trim().toLowerCase();
const SESSION_CACHE = "mock-auth-session";
const SESSION_KEY = "/session";
let hasRefreshSession = false;

const readSession = async (): Promise<boolean> => {
	try {
		const cache = await caches.open(SESSION_CACHE);
		const response = await cache.match(SESSION_KEY);
		if (!response) return false;
		const data = (await response.json()) as { hasSession?: boolean };
		return Boolean(data?.hasSession);
	} catch {
		return false;
	}
};

const writeSession = async (value: boolean): Promise<void> => {
	try {
		const cache = await caches.open(SESSION_CACHE);
		await cache.put(
			SESSION_KEY,
			new Response(JSON.stringify({ hasSession: value }), {
				headers: { "Content-Type": "application/json" },
			}),
		);
	} catch {
		// ignore cache failures in mock
	}
};

const makeAccessToken = () =>
	`mock-access-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const LoginHandler = http.post(API_AUTH_LOGIN, async ({ request }) => {
	const payload = (await request.json()) as AuthPayload;
	const email = payload.email ?? "";
	const password = payload.password ?? "";

	if (normalize(email) === normalize(KNOWN_USER.email) && password === KNOWN_USER.password) {
		hasRefreshSession = true;
		await writeSession(true);
		return HttpResponse.json(
			{
				access: makeAccessToken(),
				username: KNOWN_USER.username,
			},
			{ status: 200 },
		);
	}
	return HttpResponse.json({ error: "Wrong email or password" }, { status: 401 });
});

export const RegisterHandler = http.post(API_AUTH_REGISTER, async ({ request }) => {
	const payload = (await request.json()) as AuthPayload;
	const username = payload.username ?? "";
	const email = payload.email ?? "";

	if (username === KNOWN_USER.username)
		return HttpResponse.json(
			{
				error: "Username already taken",
				field: username,
			},
			{ status: 409 },
		);

	if (normalize(email) === KNOWN_USER.email)
		return HttpResponse.json(
			{
				error: "Email already taken",
				field: email,
			},
			{ status: 409 },
		);

	hasRefreshSession = true;
	await writeSession(true);
	return HttpResponse.json(
		{
			access: makeAccessToken(),
			username,
		},
		{},
	);
});

export const RefreshHandler = http.post(API_AUTH_REFRESH, async () => {
	const persistedSession = await readSession();
	if (!hasRefreshSession && !persistedSession) {
		return HttpResponse.json({ error: "Refresh token expired" }, { status: 401 });
	}
	hasRefreshSession = true;
	return HttpResponse.json(
		{ access: makeAccessToken(), username: KNOWN_USER.username },
		{ status: 200 },
	);
});

export const LogoutHandler = http.post(API_AUTH_LOGOUT, async () => {
	hasRefreshSession = false;
	await writeSession(false);
	return new HttpResponse(null, {
		status: 204,
	});
});
