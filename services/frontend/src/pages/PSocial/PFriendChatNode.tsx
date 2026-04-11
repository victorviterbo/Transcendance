import { Box, Stack } from "@mui/material";
import type { GPageProps } from "../common/GPageBases";
import type { IFriendInfo, IFriendMessage } from "../../types/friends";
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
import { memo } from "react";

interface PFriendChatNodeProps extends GPageProps {
	message: IFriendMessage;
	targetFriend: IFriendInfo;
}

function PFriendChatNode({ message }: PFriendChatNodeProps) {
	const isUser: boolean = message.direction == "outgoing";

	function getDate(): string {
		if (isUser && message.status && message.status == "error") return "";
		let currentDate: Date | string = message.date;
		if (typeof currentDate == "string") currentDate = new Date(message.date.toString());
		return currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString();
	}

	return (
		<Box sx={(theme) => PFriendChatNodeStyle(theme, isUser)} data-testid="PFriendChatNode">
			<Stack direction={"column"}>
				<CText family={appTexts.text.secondaryFamily} fontWeight={600} size="md">
					{message.message}
				</CText>
				<Stack direction="row" sx={{ alignItems: "center" }}>
					<CText
						sx={(theme) => PFriendChatNodeDateStyle(theme, isUser)}
						family={appTexts.text.secondaryFamily}
						size="2xs"
						fontWeight={400}
					>
						{getDate()}
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
