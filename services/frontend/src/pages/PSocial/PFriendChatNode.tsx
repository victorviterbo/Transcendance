import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";
import type { GPageProps } from "../common/GPageBases";
import type { IFriendInfo, IFriendMessage } from "../../types/socials";
import CText from "../../components/text/CText";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ErrorIcon from "@mui/icons-material/Error";
import {
	PFriendChatNodeDateStyle,
	PFriendChatNodeErrorStyle,
	PFriendChatNodeStatusStyle,
	PFriendChatNodeStyle,
} from "../../styles/pages/social/PFriendChatNodeStyle";
import { appTexts } from "../../styles/theme";
import { memo, useMemo } from "react";
import { useLang } from "../../components/contexts/CLanguageProvider";

interface PFriendChatNodeProps extends GPageProps {
	message: IFriendMessage;
	targetFriend: IFriendInfo;
}

function PFriendChatNode({ message }: PFriendChatNodeProps) {
	const isUser: boolean = message.direction == "outgoing";
	const { ttrd } = useLang();

	const currentDate: string = useMemo(() => {
		if (isUser && message.status && message.status == "error") return "";
		return ttrd(message.date, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}, [isUser, message, ttrd]);

	const theme = useTheme();
	const isTiny = useMediaQuery(theme.breakpoints.down("tn"));

	return (
		<Box sx={(theme) => PFriendChatNodeStyle(theme, isUser)} data-testid="PFriendChatNode">
			<Stack direction={"column"}>
				<CText
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size={isTiny ? "sm" : "md"}
					sx={{ overflowWrap: "break-word" }}
				>
					{message.message}
				</CText>
				<Stack direction="row" sx={{ alignItems: "center" }}>
					<CText
						sx={(theme) => PFriendChatNodeDateStyle(theme, isUser)}
						family={appTexts.text.secondaryFamily}
						size="2xs"
						fontWeight={600}
						noTr={true}
					>
						{currentDate}
					</CText>
					{isUser && message.status && message.status == "error" && (
						<CText
							sx={(theme) => PFriendChatNodeErrorStyle(theme)}
							family={appTexts.text.secondaryFamily}
							size="xs"
							fontWeight={900}
						>
							MESSAGE_SENT_FAILED
						</CText>
					)}
					{isUser && message.status && message.status == "not-sent" && (
						<AccessTimeIcon
							sx={(theme) =>
								PFriendChatNodeStatusStyle(
									theme,
									message.status ? message.status : "not-sent",
								)
							}
							fontSize="small"
						/>
					)}
					{isUser && message.status && message.status == "sent" && (
						<CheckIcon
							sx={(theme) =>
								PFriendChatNodeStatusStyle(
									theme,
									message.status ? message.status : "not-sent",
								)
							}
							fontSize="small"
						/>
					)}
					{isUser &&
						message.status &&
						(message.status == "recieved" || message.status == "read") && (
							<DoneAllIcon
								sx={(theme) =>
									PFriendChatNodeStatusStyle(
										theme,
										message.status ? message.status : "not-sent",
									)
								}
								fontSize="small"
							/>
						)}
					{isUser && message.status && message.status == "error" && (
						<ErrorIcon
							sx={(theme) =>
								PFriendChatNodeStatusStyle(
									theme,
									message.status ? message.status : "not-sent",
								)
							}
							fontSize="small"
						/>
					)}
				</Stack>
			</Stack>
		</Box>
	);
}

export default memo(PFriendChatNode);
