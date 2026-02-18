// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import api, { clearAccessToken, getAccessToken, setAccessToken } from "../api";
import { server } from "../mock/server";
import { API_AUTH_REFRESH } from "../constants";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toMatcher = (path: string) =>
	new RegExp(`^(?:https?:\\/\\/[^/]+)?${escapeRegExp(path).replace(/\\\/$/, "\\/?")}$`);

const PROTECTED_PATH = "/api/protected/";
const PROTECTED_MATCHER = toMatcher(PROTECTED_PATH);
const REFRESH_MATCHER = toMatcher(API_AUTH_REFRESH);

describe("auth interceptor", () => {
	beforeEach(() => {
		clearAccessToken();
		api.defaults.baseURL = "http://localhost";
	});

	it("valid access + valid refresh => restricted is accessible", async () => {
		setAccessToken("valid-access");
		let refreshCalls = 0;

		server.use(
			http.get(PROTECTED_MATCHER, () => {
				return HttpResponse.json({ ok: true }, { status: 200 });
			}),
			http.post(REFRESH_MATCHER, () => {
				refreshCalls += 1;
				return HttpResponse.json(
					{ access: "new-access", username: "john" },
					{ status: 200 },
				);
			}),
		);

		const res = await api.get(PROTECTED_PATH);
		expect(res.status).toBe(200);
		expect(refreshCalls).toBe(0);
	});

	it("valid access + expired refresh => restricted is accessible", async () => {
		setAccessToken("valid-access");
		let refreshCalls = 0;

		server.use(
			http.get(PROTECTED_MATCHER, () => {
				return HttpResponse.json({ ok: true }, { status: 200 });
			}),
			http.post(REFRESH_MATCHER, () => {
				refreshCalls += 1;
				return HttpResponse.json(
					{ error: "Refresh token expired" },
					{ status: 401 },
				);
			}),
		);

		const res = await api.get(PROTECTED_PATH);
		expect(res.status).toBe(200);
		expect(refreshCalls).toBe(0);
	});

	it("expired access + valid refresh => interceptor refreshes and restricted is accessible", async () => {
		setAccessToken("expired-access");
		let protectedCalls = 0;

		server.use(
			http.get(PROTECTED_MATCHER, () => {
				protectedCalls += 1;
				if (protectedCalls === 1) {
					return new HttpResponse(null, { status: 401 });
				}
				return HttpResponse.json({ ok: true }, { status: 200 });
			}),
			http.post(REFRESH_MATCHER, () => {
				return HttpResponse.json(
					{ access: "fresh-access", username: "john" },
					{ status: 200 },
				);
			}),
		);

		const res = await api.get(PROTECTED_PATH);
		expect(res.status).toBe(200);
		expect(protectedCalls).toBe(2);
		expect(getAccessToken()).toBe("fresh-access");
	});

	it("expired access + expired refresh => restricted is not accessible", async () => {
		setAccessToken("expired-access");

		server.use(
			http.get(PROTECTED_MATCHER, () => {
				return new HttpResponse(null, { status: 401 });
			}),
			http.post(REFRESH_MATCHER, () => {
				return HttpResponse.json(
					{ error: "Refresh token expired" },
					{ status: 401 },
				);
			}),
		);

		await expect(api.get(PROTECTED_PATH)).rejects.toBeDefined();
		expect(getAccessToken()).toBe(null);
	});

	it("single-flight refresh: concurrent 401s share one refresh call", async () => {
		setAccessToken("expired-access");
		let refreshCalls = 0;
		let protectedCalls = 0;

		server.use(
			http.get(PROTECTED_MATCHER, () => {
				protectedCalls += 1;
				if (protectedCalls <= 2) {
					return new HttpResponse(null, { status: 401 });
				}
				return HttpResponse.json({ ok: true }, { status: 200 });
			}),
			http.post(REFRESH_MATCHER, () => {
				refreshCalls += 1;
				return HttpResponse.json(
					{ access: "fresh-access", username: "john" },
					{ status: 200 },
				);
			}),
		);

		const [res1, res2] = await Promise.all([
			api.get(PROTECTED_PATH),
			api.get(PROTECTED_PATH),
		]);

		expect(res1.status).toBe(200);
		expect(res2.status).toBe(200);
		expect(refreshCalls).toBe(1);
		expect(protectedCalls).toBe(4);
	});

	it("refresh endpoint 401 does not trigger refresh loop", async () => {
		setAccessToken("expired-access");
		let refreshCalls = 0;

		server.use(
			http.post(REFRESH_MATCHER, () => {
				refreshCalls += 1;
				return HttpResponse.json(
					{ error: "Refresh token expired" },
					{ status: 401 },
				);
			}),
		);

		await expect(api.post(API_AUTH_REFRESH)).rejects.toBeDefined();
		expect(refreshCalls).toBe(1);
	});
});
