import { Box, Stack } from "@mui/material";
import CText from "../../components/text/CText";
import type { TNotif } from "../../types/socials";
import type { GPageProps } from "../common/GPageBases";
import { appTexts } from "../../styles/theme";
import {
	PNotifNodeImpText,
	PNotifNodeSeeButton,
	PNotifNodeStyle,
} from "../../styles/pages/social/PNotifNodeStyle";
import { ttrf } from "../../localization/localization";
import { useCallback, type ReactNode } from "react";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import LaunchIcon from "@mui/icons-material/Launch";
import { DAY_MS, HOUR_MS, MINUTE_MS } from "../../constants";

export interface PNotifNodeProps extends GPageProps {
	notif: TNotif;
	onSeeFriendsReq?: () => void;
	onSeeFriends?: () => void;
}

function PNotifNode({ notif, onSeeFriendsReq, onSeeFriends }: PNotifNodeProps) {
	const handleSee = useCallback(() => {
		if (notif.kind == "friend-request" && onSeeFriendsReq) onSeeFriendsReq();
		if (notif.kind == "friend-accepted" && onSeeFriends) onSeeFriends();
	}, [notif, onSeeFriendsReq, onSeeFriends]);

	const getAgo = useCallback((): string => {
		const dateIn = typeof notif.date == "string" ? new Date(notif.date) : notif.date;
		const timeSinceNotifMilliseconds: number = Date.now() - dateIn.getTime();
		if (timeSinceNotifMilliseconds >= DAY_MS)
			return ttrf("NOTIF_AGO_DAYS", {
				COUNT: Number(Math.trunc(timeSinceNotifMilliseconds / DAY_MS)).toString(),
			});
		else if (timeSinceNotifMilliseconds >= HOUR_MS)
			return ttrf("NOTIF_AGO_HOURS", {
				COUNT: Number(Math.trunc(timeSinceNotifMilliseconds / HOUR_MS)).toString(),
			});
		else if (timeSinceNotifMilliseconds >= MINUTE_MS)
			return ttrf("NOTIF_AGO_MINUTES", {
				COUNT: Number(Math.trunc(timeSinceNotifMilliseconds / MINUTE_MS)).toString(),
			});
		return "NOTIF_AGO_LESS";
	}, [notif]);

	const getMessage = useCallback((): ReactNode => {
		if (notif.kind == "friend-request")
			return (
				<>
					<CText>NOTIF_FRIEND_REQ</CText>
					<CText noTr={true} sx={PNotifNodeImpText}>
						{notif.from.username}
					</CText>
				</>
			);
		else if (notif.kind == "friend-accepted")
			return (
				<>
					<CText>NOTIF_FRIEND_ACCEPTED</CText>
					<CText noTr={true} sx={PNotifNodeImpText}>
						{notif.from.username}
					</CText>
				</>
			);
		return <CText>NOTIF_UNKNOWN</CText>;
	}, [notif]);

	return (
		<Box sx={(theme) => PNotifNodeStyle(theme, { notif })} data-testid="PNotifNode">
			<Stack direction={"row"}>
				<Stack direction={"column"}>
					<Stack direction={"row"}>{getMessage()}</Stack>
					<CText family={appTexts.text.secondaryFamily} size="xs" fontWeight={400}>
						{getAgo()}
					</CText>
				</Stack>
				<CIconButton
					onClick={handleSee}
					sx={PNotifNodeSeeButton}
					data-testid="PNotifNodeSee"
				>
					<LaunchIcon fontSize="small" />
				</CIconButton>
			</Stack>
		</Box>
	);
}

export default PNotifNode;
