import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_AUTH_LOGIN, API_AUTH_LOGOUT, API_AUTH_REFRESH, API_AUTH_REGISTER } from "./constants";

let accessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
	accessToken = token;
};

export const clearAccessToken = () => {
	accessToken = null;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
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
		if (!isRefreshing) {
			isRefreshing = true;
			refreshPromise = api
				.post(API_AUTH_REFRESH)
				.then((res) => {
					const token = res.data?.access;
					return typeof token === "string" && token.length > 0 ? token : null;
				})
				.catch(() => null)
				.finally(() => {
					isRefreshing = false;
					refreshPromise = null;
				});
		}
		const newToken = await refreshPromise;
		if (!newToken) {
			clearAccessToken();
			return Promise.reject(error);
		}
		setAccessToken(newToken);
		original.headers = original.headers ?? {};
		original.headers.Authorization = `Bearer ${newToken}`;
		return api(original);
	},
);

export default api;
