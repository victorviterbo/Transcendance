import axios from "axios";

let accessToken: string | null = null;

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

export default api;
