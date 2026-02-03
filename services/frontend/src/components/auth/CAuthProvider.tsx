import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { type IAuthUser, type TAuthStatus } from "../../types/user";
import type { GCompProps } from "../common/GProps";
import api, { clearAccessToken, getAccessToken, setAccessToken } from "../../api";
import { API_AUTH_LOGOUT, API_AUTH_REFRESH } from "../../constants";
import { jwtDecode } from "jwt-decode";

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

	const decodeUser = useCallback((token: string): IAuthUser | null => {
		try {
			const decoded = jwtDecode<{ sub?: string; username?: string; email?: string }>(token);
			return {
				id: decoded.sub ? Number(decoded.sub) : 0,
				username: decoded.username ?? "",
				email: decoded.email ?? "",
			};
		} catch {
			return null;
		}
	}, []);

	const setAuth = useCallback(
		(token: string | null, nextUser?: IAuthUser | null) => {
			setAccessToken(token);
			if (token) {
				setUser(nextUser ?? decodeUser(token));
				setStatus("authed");
			} else {
				setUser(null);
				setStatus("guest");
			}
		},
		[decodeUser],
	);

	useEffect(() => {
		console.log(status);
		console.log(getAccessToken());
		api.post(API_AUTH_REFRESH)
			.then((res) => {
				setAuth(res.data.access);
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
