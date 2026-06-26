import { Box, Stack } from "@mui/material";
import CTitleBasePaper from "../../components/surfaces/CTitleBasePaper";
import CText from "../../components/text/CText";
import { CTitlePaperTitleStyle } from "../../styles/components/surfaces/CTitlePaper";
import { type TNotif } from "../../types/socials";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { getErrorNode } from "../../utils/error";
import PNotifNode from "./PNotifNode";
import type { GPageProps } from "../common/GPageBases";
import type { IWSContextModule, IWSGameSendEvent, TWSRcv } from "../../types/websocket";
import { useWS } from "../../components/websocket/CWebsocket";
import { fetchNotifications, markNotificationsRead } from "../../api/social";

interface PNotifProps extends GPageProps {
	onSeeFriendsReq: () => void;
	onSeeFriends: () => void;
	onNotifCount: (Count: number) => void;
	isOpen: boolean;
}

function PNotif({ onSeeFriendsReq, onSeeFriends, onNotifCount, isOpen }: PNotifProps) {
	const [notifs, setNotifs] = useState<TNotif[]>([]);
	const [unread, setUnread] = useState<number>(0);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const localId = useId();
	const wsContext: IWSContextModule = useWS("notif");
	const readTimeout: React.RefObject<number> = useRef(-1);

	//====================== GETTERS ======================
	function getTitle() {
		return (
			<Box
				sx={[
					{ position: "relative", height: "40px" },
					...(Array.isArray(CTitlePaperTitleStyle)
						? CTitlePaperTitleStyle
						: CTitlePaperTitleStyle
							? [CTitlePaperTitleStyle]
							: []),
				]}
			>
				<Stack
					direction="row"
					sx={{
						position: "absolute",
						inset: 0,
						alignItems: "center",
						justifyContent: "center",
						flex: 1,
					}}
				>
					<CText size={"lg"} textAlign="center">
						NOTIF_TITLE
					</CText>
				</Stack>
			</Box>
		);
	}

	function getFriendsList(): ReactNode | ReactNode[] {
		if (error) return error;

		if (notifs.length == 0) return <CText align="center">NOTIF_EMPTY</CText>;
		return notifs.map((value: TNotif, index: number) => {
			return (
				<PNotifNode
					notif={value}
					key={localId + index}
					onSeeFriendsReq={onSeeFriendsReq}
					onSeeFriends={onSeeFriends}
				></PNotifNode>
			);
		});
	}

	//====================== EVENT / UPDATES ======================
	useEffect(() => {
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | IWSGameSendEvent | undefined = wsContext.getLast();
				if (last?.target == "notif") {
					if (last.event == "new") {
						notifs.splice(0, 0, last.notif);
						setNotifs(structuredClone(notifs));
					}
				}
			}
		});
	}, [wsContext, notifs, setNotifs]);

	useEffect(() => {
		const getNotifs = async (): Promise<void> => {
			try {
				const res = await fetchNotifications();
				if (typeof res != "object" || !res.notifs) throw {};

				setNotifs(res.notifs);
				setError(undefined);
			} catch (error) {
				setError(getErrorNode(error, "NOTIF_FAILED"));
				setNotifs([]);
			}
		};
		getNotifs();
	}, []);

	useEffect(() => {
		onNotifCount(unread);
	}, [unread, onNotifCount]);

	useEffect(() => {
		setUnread(
			notifs.filter((value: TNotif) => {
				return !value.read;
			}).length,
		);
	}, [notifs, setUnread]);

	useEffect(() => {
		if (readTimeout.current != -1) {
			clearTimeout(readTimeout.current);
			readTimeout.current = -1;
		}
		const sendRead = async () => {
			readTimeout.current = setTimeout(async () => {
				try {
					await markNotificationsRead();
					setUnread(0);
				} catch (error) {
					setError(getErrorNode(error, "NOTIF_FAILED"));
				}

				notifs.forEach((notif: TNotif) => {
					notif.read = true;
				});
				setNotifs(structuredClone(notifs));
			}, 2000);
		};
		if (isOpen && unread > 0) sendRead();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, unread]);

	return (
		<CTitleBasePaper
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			position="relative"
			sx={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				marginBottom: "20px",
				minHeight: 0,
				overflow: "hidden",
			}}
			titleNode={getTitle()}
			data-testid="PNotif"
		>
			<Box
				sx={{
					position: "absolute",
					padding: "inherit",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					flex: 1,
					overflow: "hidden",
				}}
			>
				<Stack sx={{overflowY: "auto"}}>{getFriendsList()}</Stack>
			</Box>
		</CTitleBasePaper>
	);
}

export default PNotif;
