import { Stack } from "@mui/material";
import CGamePaper from "../../components/surfaces/CGamePaper";
import type { GPageProps } from "../common/GPageBases";
import type { IGameChatMsg, IGamePlayer } from "../../types/game";
import { appTexts } from "../../styles/theme";
import CTextField from "../../components/inputs/textFields/CTextField";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import SendIcon from "@mui/icons-material/Send";
import { PGameChatSendStack } from "../../styles/pages/game/PGameChatStyle";
import { useMemo, useState, type ReactNode } from "react";
import PGameChatNode from "./PGameChatNode";
import type { TWSSend } from "../../types/websocket";

interface PGameChatProps extends GPageProps {
	chat: IGameChatMsg[];
	users: IGamePlayer[];
	sendWSMessage: (dataSent: Omit<TWSSend, "target">) => void;
}

function PGameChat({ chat, users, sendWSMessage }: PGameChatProps) {
	//====================== NAME ======================
	const [messageField, setMessageField] = useState<string>("");

	//====================== GETTERS ======================
	const chatList = useMemo((): ReactNode[] => {
		return chat.map((msg: IGameChatMsg) => {
			const targetUser: IGamePlayer | undefined = users.find((user: IGamePlayer) => {
				return user.user.uid == msg.useruid;
			});
			return (
				<PGameChatNode message={msg} user={targetUser} key={msg.messageuid}></PGameChatNode>
			);
		});
	}, [chat, users]);

	//====================== EVENT ======================
	function handleSendMessage() {
		if (!messageField || messageField.length == 0) return;
		sendWSMessage({
			event: "message-send",
			message: messageField,
		});
		setMessageField("");
	}

	//====================== STRUCT ======================
	return (
		<CGamePaper
			title={"GAME_CHAT_TITLE"}
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			position="relative"
			sx={{
				height: "100%",
				display: "flex",
				overflow: "hidden",
			}}
			contentPadding={"0px"}
		>
			<Stack
				sx={{
					position: "absolute",
					padding: "inherit",
					inset: 0,
					overflow: "hidden",
				}}
			>
				<Stack sx={{ flex: 1, flexDirection: "column-reverse", overflow: "auto" }}>
					{chatList}
				</Stack>
				<Stack direction={"row"} sx={PGameChatSendStack()}>
					<CTextField
						sx={{ flex: 1, m: 0 }}
						fontWeight={500}
						fontFamily={appTexts.text.secondaryFamily}
						fontSize={appTexts.text.sizes.xs}
						borderWidth="0px"
						verticalPadding="10px"
						value={messageField}
						onChange={(event) => {
							setMessageField(event.target.value);
						}}
						onKeyUp={(event) => {
							if (event.code == "Enter") handleSendMessage();
						}}
						data-testid="PGameChat-TextField"
					></CTextField>
					<CIconButton
						onClick={handleSendMessage}
						sx={{ my: "auto", ml: "10px" }}
						data-testid="PGameChat-SendButton"
					>
						<SendIcon fontSize="small" />
					</CIconButton>
				</Stack>
			</Stack>
		</CGamePaper>
	);
}

export default PGameChat;
