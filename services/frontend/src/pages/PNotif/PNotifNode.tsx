import { Box, Stack } from "@mui/material";
import CText from "../../components/text/CText";
import type { TNotif } from "../../types/socials";
import type { GPageProps } from "../common/GPageBases";
import { appTexts } from "../../styles/theme";
import { PNotifNodeStyle, type INotifNodeStyle } from "../../styles/pages/social/PNotifNodeStyle";
import { ttrf, ttrfn } from "../../localization/localization";
import { memo, useCallback, useMemo, type ReactNode } from "react";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import CUserProfileLink from "../../components/navigation/CUserProfileLink";
import LaunchIcon from "@mui/icons-material/Launch";
import { DAY_MS, HOUR_MS, MINUTE_MS } from "../../constants";

export interface PNotifNodeProps extends GPageProps {
	notif: TNotif;
	onSeeFriendsReq?: () => void;
	onSeeFriends?: () => void;
}

function PNotifNode({ notif, onSeeFriendsReq, onSeeFriends }: PNotifNodeProps) {
	const style: INotifNodeStyle = useMemo(() => {
		return PNotifNodeStyle({ notif });
	}, [notif]);

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

	const messageNode: ReactNode = useMemo(() => {
		if (notif.kind == "friend-request")
			return (
				<>
					<CText size="sm">
						{ttrfn("NOTIF_FRIEND_REQ", {
							USERNAME: (
								<CUserProfileLink
									sx={{ display: "inline" }}
									username={notif.from.username}
								>
									<CText noTr={true} sx={style.impText}>
										{notif.from.username}
									</CText>
								</CUserProfileLink>
							),
						})}
					</CText>
				</>
			);
		else if (notif.kind == "friend-accepted")
			return (
				<>
					<CText size="sm">
						{ttrfn("NOTIF_FRIEND_ACCEPTED", {
							USERNAME: (
								<CUserProfileLink
									sx={{ display: "inline" }}
									username={notif.from.username}
								>
									<CText noTr={true} sx={style.impText}>
										{notif.from.username}
									</CText>
								</CUserProfileLink>
							),
						})}
					</CText>
				</>
			);
		return <CText>NOTIF_UNKNOWN</CText>;
	}, [notif, style]);

	return (
		<Box sx={style.main} data-testid="PNotifNode">
			<Stack direction={"row"}>
				<Stack direction={"column"}>
					<Stack direction={"row"}>{messageNode}</Stack>
					<CText family={appTexts.text.secondaryFamily} size="xs" fontWeight={400}>
						{getAgo()}
					</CText>
				</Stack>
				<CIconButton onClick={handleSee} sx={style.button} data-testid="PNotifNodeSee">
					<LaunchIcon fontSize="small" />
				</CIconButton>
			</Stack>
		</Box>
	);
}

export default memo(PNotifNode);
