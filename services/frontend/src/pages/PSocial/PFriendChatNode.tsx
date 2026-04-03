import { Box, Stack } from "@mui/material";
import type { GPageProps } from "../common/GPageBases";
import type { IFriendInfo, IFriendMessage } from "../../types/friends";
import CText from "../../components/text/CText";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
	PFriendChatNodeDateStyle,
	PFriendChatNodeStatusStyle,
	PFriendChatNodeStyle,
} from "../../styles/pages/social/PFriendChatNodeStyle";
import { appTexts } from "../../styles/theme";

interface PFriendChatNodeProps extends GPageProps {
	message: IFriendMessage;
	targetFriend: IFriendInfo;
}

function PFriendChatNode({ message, targetFriend }: PFriendChatNodeProps) {
	const isUser: boolean = message.fromid != targetFriend.uid;

	return (
		<Box sx={(theme) => PFriendChatNodeStyle(theme, isUser)}>
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
						{(message.date as Date).toLocaleDateString() +
							" " +
							(message.date as Date).toLocaleTimeString()}
					</CText>
					{isUser && message.status == "not-sent" && (
						<AccessTimeIcon
							sx={(theme) => PFriendChatNodeStatusStyle(theme, message.status)}
						/>
					)}
					{isUser && message.status == "sent" && (
						<CheckIcon
							sx={(theme) => PFriendChatNodeStatusStyle(theme, message.status)}
						/>
					)}
					{isUser && (message.status == "recieved" || message.status == "read") && (
						<DoneAllIcon
							sx={(theme) => PFriendChatNodeStatusStyle(theme, message.status)}
							fontSize="small"
						/>
					)}
				</Stack>
			</Stack>
		</Box>
	);
}

export default PFriendChatNode;
