import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { type IAuthUser, type TAuthStatus } from "../../types/user";
import type { GCompProps } from "../common/GProps";
import api, { clearAccessToken, setAccessToken, setAuthFailureHandler } from "../../api";
import {
	API_AUTH_LOGOUT,
	API_AUTH_REFRESH,
	AUTH_CHANNEL,
	AUTH_CHANNEL_LOGIN,
	AUTH_CHANNEL_LOGOUT,
} from "../../constants";

interface AuthChannelLoginMessage {
	type: typeof AUTH_CHANNEL_LOGIN;
	access: string;
	user: IAuthUser;
}

interface AuthChannelLogoutMessage {
	type: typeof AUTH_CHANNEL_LOGOUT;
}

type AuthChannelMessage = AuthChannelLoginMessage | AuthChannelLogoutMessage;

interface AuthContextValue {
	status: TAuthStatus;
	user: IAuthUser | null;
	login: (token: string, user: IAuthUser) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
	status: "loading",
	user: null,
	login: () => {},
	logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface CAuthProviderProps extends GCompProps {
	children: ReactNode;
}

export function CAuthProvider({ children }: CAuthProviderProps) {
	const [status, setStatus] = useState<TAuthStatus>("loading");
	const [user, setUser] = useState<IAuthUser | null>(null);
	const channelRef = useRef<BroadcastChannel | null>(null);

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

	const login = useCallback(
		(token: string, user: IAuthUser) => {
			setAuth(token, user);
			channelRef.current?.postMessage({
				type: AUTH_CHANNEL_LOGIN,
				access: token,
				user,
			} satisfies AuthChannelLoginMessage);
		},
		[setAuth],
	);

	const refresh = useCallback(async () => {
		try {
			const res = await api.post(API_AUTH_REFRESH);

			const access = res.data?.access;
			const username = typeof res.data?.username === "string" ? res.data.username : "";

			if (!access || !username) {
				setAuth(null);
				return;
			}

			login(access, { username });
		} catch {
			setAuth(null);
		}
	}, [login, setAuth]);

	const logout = async () => {
		try {
			await api.post(API_AUTH_LOGOUT);
		} finally {
			clearAccessToken();
			setAuth(null);
			channelRef.current?.postMessage({
				type: AUTH_CHANNEL_LOGOUT,
			} satisfies AuthChannelLogoutMessage);
		}
	};

	// Bootstrap auth on page load
	useEffect(() => {
		refresh();
	}, [refresh]);

	// Handle cross-tab interactions
	useEffect(() => {
		if (!("BroadcastChannel" in window)) return;

		const channel = new BroadcastChannel(AUTH_CHANNEL);
		channelRef.current = channel;

		channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
			if (event.data?.type === AUTH_CHANNEL_LOGIN) {
				const access = event.data?.access;
				const user = event.data?.user;

				if (typeof access === "string" && user?.username) {
					setAuth(access, user);
				}
			}

			if (event.data?.type === AUTH_CHANNEL_LOGOUT) {
				setAuth(null);
			}
		};

		return () => {
			channel.close();
			if (channelRef.current === channel) {
				channelRef.current = null;
			}
		};
	}, [setAuth]);

	return (
		<AuthContext.Provider value={{ status, user, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}
