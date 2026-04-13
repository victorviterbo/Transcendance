import { Box, Stack } from "@mui/material";
import CTitleBasePaper from "../../components/surfaces/CTitleBasePaper";
import CText from "../../components/text/CText";
import { CTitlePaperTitleStyle } from "../../styles/components/surfaces/CTitlePaper";
import type { AxiosResponse } from "axios";
import { type TNotif, type INotifList } from "../../types/socials";
import api from "../../api";
import { API_SOCIAL_NOTIFS, API_SOCIAL_NOTIFS_READ } from "../../constants";
import { useEffect, useId, useState, type ReactNode } from "react";
import { getErrorNode } from "../../utils/error";
import PNotifNode from "./PNotifNode";
import type { GPageProps } from "../common/GPageBases";
import type { IErrorStruct } from "../../types/error";

interface PNotifProps extends GPageProps {
	onSeeFriendsReq: () => void;
	onNotifCount: (Count: number) => void;
	isOpen: boolean;
}

function PNotif({ onSeeFriendsReq, onNotifCount, isOpen }: PNotifProps) {
	const [notifs, setNotifs] = useState<TNotif[]>([]);
	const [unread, setUnread] = useState<number>(0);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const localId = useId();

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

	useEffect(() => {
		const getNotifs = async (): Promise<void> => {
			try {
				const res: AxiosResponse<INotifList> = await api.get(API_SOCIAL_NOTIFS);
				if (!res) throw {};
				if (res.data.error) throw res.data.error;
				if (typeof res.data != "object" || !res.data.notifs) throw {};

				setNotifs(res.data.notifs);
				setError(undefined);

				setUnread(
					res.data.notifs.filter((value: TNotif) => {
						return value.read;
					}).length,
				);
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
		const sendRead = async () => {
			try {
				const res: AxiosResponse<{ error?: IErrorStruct }> =
					await api.post(API_SOCIAL_NOTIFS_READ);
				if (!res) throw {};
				if (res.data.error) throw res.data.error;
				setUnread(0);
			} catch (error) {
				setError(getErrorNode(error, "NOTIF_FAILED"));
			}
		};
		if (isOpen && unread > 0) sendRead();
	}, [isOpen, unread]);

	function getFriendsList(): ReactNode | ReactNode[] {
		if (error) return error;

		if (notifs.length == 0) return <CText align="center">NOTIF_EMPTY</CText>;
		return notifs.map((value: TNotif, index: number) => {
			return (
				<PNotifNode
					notif={value}
					key={localId + index}
					onSeeFriendsReq={onSeeFriendsReq}
				></PNotifNode>
			);
		});
	}

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
				<Stack>{getFriendsList()}</Stack>
			</Box>
		</CTitleBasePaper>
	);
}

export default PNotif;
