import { http, HttpResponse } from "msw";
import type { IAuthUser } from "../../types/user";

type AuthPayload = Partial<IAuthUser> & { password?: string };

const KNOWN_USER: IAuthUser & { password: string } = {
	id: 1,
	username: "john",
	email: "john@42.fr",
	password: "secret",
};

const normalize = (value: string) => value.trim().toLowerCase();

export const LoginHandler = http.post("/api/auth/login", async ({ request }) => {
	const payload = (await request.json()) as AuthPayload;
	const email = payload.email ?? "";
	const password = payload.password ?? "";

	if (normalize(email) === normalize(KNOWN_USER.email) && password === KNOWN_USER.password) {
		return HttpResponse.json(
			{
				id: KNOWN_USER.id,
				username: KNOWN_USER.username,
				email: KNOWN_USER.email,
			},
			{ status: 200 },
		);
	}
	return HttpResponse.json({ error: "Wrong email or password" }, { status: 401 });
});

export const RegisterHandler = http.post("/api/auth/register", async ({ request }) => {
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

	return HttpResponse.json({
		username: payload.username ?? "",
		email: payload.email ?? "",
	});
});
