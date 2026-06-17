import {
	createContext,
	useContext,
	useEffect,
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
});

export const useNotif = (): IAppNotifContext => {
	return useContext(notifContext);
};

//====================== STRUCT ======================
interface CAppNotifContextProps {
	children: ReactNode;
}

function CAppNotifContext({ children }: CAppNotifContextProps) {
	const [notifications, setNotifications] = useState<IAppNotif[]>([
		{
			severity: "error",
			message: "this is a test",
		},
		{
			severity: "info",
			message: "this is a test 2",
		},
	]);

	useEffect(() => {
		if (notifications.length > 4) return;
		setTimeout(() => {
			notifications.push({
				severity: "warning",
				message: "random warning",
			});
			setNotifications(structuredClone(notifications));
		}, 2000);
	}, [setNotifications, notifications]);

	const notifs: ReactNode[] = useMemo((): ReactNode[] => {
		return notifications.map((notif: IAppNotif) => {
			if (!notif.uid) notif.uid = crypto.randomUUID();
			return <CAlert sx={{ mt: "5px" }} time={3000} key={notif.uid} notif={notif} />;
		});
	}, [notifications]);

	return (
		<>
			<Stack
				direction={"column-reverse"}
				sx={{ position: "fixed", bottom: "10px", left: "10px", zIndex: 100 }}
			>
				{notifs}
			</Stack>
			{children}
		</>
	);
}

export default CAppNotifContext;
