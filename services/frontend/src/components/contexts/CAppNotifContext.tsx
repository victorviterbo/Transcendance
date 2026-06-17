import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type Context,
	type ReactNode,
} from "react";
import type { IAppNotif, IAppNotifContext } from "../../types/events";
import { Stack } from "@mui/material";
import CAlert from "../feedback/alerts/CAlert";

//====================== CONTEXT ======================
const notifContext: Context<IAppNotifContext> = createContext<IAppNotifContext>({
	notifications: [],
	push: (_) => {},
});

export const useNotif = (): IAppNotifContext => {
	return useContext(notifContext);
};

//====================== STRUCT ======================
interface CAppNotifContextProps {
	children: ReactNode;
}

function CAppNotifContext({ children }: CAppNotifContextProps) {
	const [notifications, setNotifications] = useState<IAppNotif[]>([]);

	const notifs: ReactNode[] = useMemo((): ReactNode[] => {
		return notifications.map((notif: IAppNotif) => {
			if (!notif.uid) notif.uid = crypto.randomUUID();
			return <CAlert sx={{ mt: "5px" }} time={6000} key={notif.uid} notif={notif} />;
		});
	}, [notifications]);

	const pushNotif = useCallback(
		(notif: IAppNotif) => {
			notifications.push(notif);
			setNotifications(structuredClone(notifications));
		},
		[notifications, setNotifications],
	);

	return (
		<>
			<Stack
				direction={"column-reverse"}
				sx={{ position: "fixed", bottom: "10px", left: "10px", zIndex: 100 }}
			>
				{notifs}
			</Stack>
			<notifContext.Provider value={{ notifications, push: pushNotif }}>
				{children}
			</notifContext.Provider>
		</>
	);
}

export default CAppNotifContext;
