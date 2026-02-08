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
const REFRESH_COOKIE_NAME = "refresh_token";
let hasRefreshSession = false;

const base64UrlEncode = (value: string) => {
	const base64 = btoa(unescape(encodeURIComponent(value)));
	return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

const makeFakeJwt = (user: IAuthUser) => {
	const header = { alg: "none", typ: "JWT" };
	const payload = {
		sub: String(user.id),
		username: user.username,
		email: user.email,
		exp: Math.floor(Date.now() / 1000) + 15 * 60,
	};
	return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
		JSON.stringify(payload),
	)}.`;
};

const parseCookies = (cookieHeader: string | null) => {
	if (!cookieHeader) return {};
	return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
		const [rawKey, ...rawValue] = part.trim().split("=");
		if (!rawKey) return acc;
		acc[rawKey] = decodeURIComponent(rawValue.join("="));
		return acc;
	}, {});
};

const issueRefreshCookie = () =>
	`${REFRESH_COOKIE_NAME}=mock-refresh; Path=/; HttpOnly; SameSite=Lax`;

export const LoginHandler = http.post(API_AUTH_LOGIN, async ({ request }) => {
	const payload = (await request.json()) as AuthPayload;
	const email = payload.email ?? "";
	const password = payload.password ?? "";

	if (normalize(email) === normalize(KNOWN_USER.email) && password === KNOWN_USER.password) {
		hasRefreshSession = true;
		return HttpResponse.json(
			{
				access: makeFakeJwt(KNOWN_USER),
				username: KNOWN_USER.username,
			},
			{
				status: 200,
				headers: {
					"Set-Cookie": issueRefreshCookie(),
				},
			},
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
	return HttpResponse.json(
		{
			access: makeFakeJwt({
				id: 2,
				username: username,
				email: normalize(email),
			}),
			username,
		},
		{
			headers: {
				"Set-Cookie": issueRefreshCookie(),
			},
		},
	);
});

export const RefreshHandler = http.post(API_AUTH_REFRESH, ({ request }) => {
	const cookies = parseCookies(request.headers.get("cookie"));
	if (!cookies[REFRESH_COOKIE_NAME] && !hasRefreshSession) {
		return HttpResponse.json({ error: "Refresh token expired" }, { status: 401 });
	}
	return HttpResponse.json(
		{ access: makeFakeJwt(KNOWN_USER), username: KNOWN_USER.username },
		{ status: 200 },
	);
});

export const LogoutHandler = http.post(API_AUTH_LOGOUT, () => {
	hasRefreshSession = false;
	return new HttpResponse(null, {
		status: 204,
		headers: {
			"Set-Cookie": `${REFRESH_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`,
		},
	});
});
