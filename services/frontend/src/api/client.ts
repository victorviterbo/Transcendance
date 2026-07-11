import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_AUTH_LOGIN, API_AUTH_LOGOUT, API_AUTH_REFRESH, API_AUTH_REGISTER } from "../constants";

let accessToken: string | null = null;
let refreshPromise: Promise<{ access: string; username?: string } | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
	accessToken = token;
};

export const clearAccessToken = () => {
	accessToken = null;
};

export const getAccessToken = () => accessToken;

export const setAuthFailureHandler = (handler: (() => void) | null) => {
	authFailureHandler = handler;
};

const notifyAuthFailure = () => {
	if (authFailureHandler) {
		authFailureHandler();
	}
};

const api = axios.create({
	withCredentials: true,
});

const normalizePath = (value: string) => value.replace(/\/+$/, "");
const authPaths = [API_AUTH_LOGIN, API_AUTH_LOGOUT, API_AUTH_REFRESH, API_AUTH_REGISTER].map(
	normalizePath,
);

const isAuthRequest = (url?: string) => {
	if (!url) return false;
	if (url.startsWith("http://") || url.startsWith("https://")) {
		try {
			const path = normalizePath(new URL(url).pathname);
			return authPaths.includes(path);
		} catch {
			return false;
		}
	}
	return authPaths.includes(normalizePath(url));
};

export const refreshAccessToken = async (): Promise<{
	access: string;
	username?: string;
} | null> => {
	if (!refreshPromise) {
		refreshPromise = api
			.post(API_AUTH_REFRESH)
			.then((res) => {
				const access = res.data?.access;
				if (typeof access !== "string" || access.length === 0) return null;

				const username = res.data?.username;
				return {
					access,
					...(typeof username === "string" ? { username } : {}),
				};
			})
			.catch(() => null)
			.finally(() => {
				refreshPromise = null;
			});
	}

	return refreshPromise;
};

api.interceptors.request.use(
	(config) => {
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
	(res) => res,
	async (error) => {
		const original = error?.config as RetryConfig | undefined;
		if (!original || error?.response?.status !== 401 || original._retry) {
			return Promise.reject(error);
		}
		if (isAuthRequest(original.url)) {
			return Promise.reject(error);
		}
		original._retry = true;
		const refreshed = await refreshAccessToken();
		const newToken = refreshed?.access ?? null;
		if (!newToken) {
			clearAccessToken();
			notifyAuthFailure();
			return Promise.reject(error);
		}
		setAccessToken(newToken);
		original.headers = original.headers ?? {};
		original.headers.Authorization = `Bearer ${newToken}`;
		return api(original);
	},
);

export default api;
