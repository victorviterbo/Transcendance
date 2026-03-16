import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { type IAuthUser, type TAuthStatus } from "../../types/user";
import type { GCompProps } from "../common/GProps";
import api, { clearAccessToken, setAccessToken, setAuthFailureHandler } from "../../api";
import { API_AUTH_LOGOUT, API_AUTH_REFRESH } from "../../constants";

const AuthContext = createContext({
	status: "loading" as TAuthStatus,
	user: null as IAuthUser | null,
	setAuth: (_token: string | null, _user?: IAuthUser | null) => {},
	logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface CAuthProviderProps extends GCompProps {
	children: ReactNode;
}

export function CAuthProvider({ children }: CAuthProviderProps) {
	const [status, setStatus] = useState<TAuthStatus>("loading");
	const [user, setUser] = useState<IAuthUser | null>(null);

	const setAuth = useCallback((token: string | null, nextUser?: IAuthUser | null) => {
		setAccessToken(token);
		if (token) {
			if (!nextUser) {
				throw new Error("setAuth requires a user when token is provided.");
			}
			setUser(nextUser);
			setStatus("authed");
		} else {
			setUser(null);
			setStatus("guest");
		}
	}, []);

	useEffect(() => {
		setAuthFailureHandler(() => setAuth(null));
		return () => setAuthFailureHandler(null);
	}, [setAuth]);

	useEffect(() => {
		api.post(API_AUTH_REFRESH)
			.then((res) => {
				const access = res.data?.access;
				if (!access) {
					setAuth(null);
					return;
				}
				const username = typeof res.data?.username === "string" ? res.data.username : "";
				if (!username) {
					setAuth(null);
					return;
				}
				setAuth(access, { username });
			})
			.catch(() => setAuth(null));
	}, [status, setAuth]);

	const logout = async () => {
		await api.post(API_AUTH_LOGOUT);
		clearAccessToken();
		setUser(null);
		setStatus("guest");
	};

	return (
		<AuthContext.Provider value={{ status, user, setAuth, logout }}>
			{children}
		</AuthContext.Provider>
	);
}
