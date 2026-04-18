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
import { useCallback } from "react";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import LaunchIcon from "@mui/icons-material/Launch";

export interface PNotifNodeProps extends GPageProps {
	notif: TNotif;
	onSeeFriendsReq?: () => void;
}

function PNotifNode({ notif, onSeeFriendsReq }: PNotifNodeProps) {
	const handleSee = useCallback(() => {
		if (notif.kind == "friend-request" && onSeeFriendsReq) onSeeFriendsReq();
	}, [notif, onSeeFriendsReq]);

	const getAgo = useCallback((): string => {
		const dateIn = typeof notif.date == "string" ? new Date(notif.date) : notif.date;
		const timeSince: number = Date.now() - dateIn.getTime();
		if (timeSince >= 1000 * 60 * 60 * 24)
			return ttrf("NOTIF_AGO_DAYS", {
				COUNT: Number(Math.trunc(timeSince / (1000 * 60 * 60 * 24))).toString(),
			});
		else if (timeSince >= 1000 * 60 * 60)
			return ttrf("NOTIF_AGO_HOURS", {
				COUNT: Number(Math.trunc(timeSince / (1000 * 60 * 60))).toString(),
			});
		else if (timeSince >= 1000 * 60)
			return ttrf("NOTIF_AGO_MINUTES", {
				COUNT: Number(Math.trunc(timeSince / (1000 * 60))).toString(),
			});
		return "NOTIF_AGO_LESS";
	}, [notif]);

	return (
		<Box sx={(theme) => PNotifNodeStyle(theme, { notif })} data-testid="PNotifNode">
			<Stack direction={"row"}>
				<Stack direction={"column"}>
					<Stack direction={"row"}>
						<CText>NOTIF_FRIEND_REQ</CText>
						<CText sx={PNotifNodeImpText}>{notif.from.username}</CText>
					</Stack>
					<CText family={appTexts.text.secondaryFamily} size="xs" fontWeight={400}>
						{getAgo()}
					</CText>
				</Stack>
				<CIconButton
					onClick={handleSee}
					sx={PNotifNodeSeeButton}
					data-testid="PNotifNodeSeeReq"
				>
					<LaunchIcon fontSize="small" />
				</CIconButton>
			</Stack>
		</Box>
	);
}

export default PNotifNode;
