import { Stack } from "@mui/material";
import CGamePaper from "../../components/surfaces/CGamePaper";
import type { GPageProps } from "../common/GPageBases";
import type { IGameChatMsg, IGameData, IGamePlayer } from "../../types/game";
import { appTexts } from "../../styles/theme";
import CTextField from "../../components/inputs/textFields/CTextField";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import SendIcon from "@mui/icons-material/Send";
import { PGameChatSendStack } from "../../styles/pages/game/PGameChatStyle";
import { useEffect, useState, type ReactNode } from "react";
import PGameChatNode from "./PGameChatNode";

interface PGameChatProps extends GPageProps {
	game: IGameData;
}

function PGameChat({ game }: PGameChatProps) {
	//====================== NAME ======================
	const [users, setUsers] = useState<IGamePlayer[]>([]);
	const [chat, setChat] = useState<IGameChatMsg[]>([]);

	useEffect(() => {
		async function updatePlayers() {
			setUsers(game.players);
		}
		updatePlayers();
	}, [game.players]);

	useEffect(() => {
		async function updateChat() {
			setChat(game.chat.reverse());
		}
		updateChat();
	}, [game.chat]);

	//====================== GETTERS ======================
	function getChat(): ReactNode[] {
		return chat.map((msg: IGameChatMsg) => {
			const targetUser: IGamePlayer | undefined = users.find((user: IGamePlayer) => {
				return user.user.uid == msg.userid;
			});
			if (!targetUser) return null;
			return <PGameChatNode message={msg} user={targetUser} key={msg.uid}></PGameChatNode>;
		});
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
					overflow: "auto",
				}}
			>
				<Stack sx={{ flex: 1, flexDirection: "column-reverse" }}>{getChat()}</Stack>
				<Stack direction={"row"} sx={PGameChatSendStack()}>
					<CTextField
						sx={{ flex: 1, m: 0 }}
						fontWeight={500}
						fontFamily={appTexts.text.secondaryFamily}
						fontSize={appTexts.text.sizes.xs}
						borderWidth="0px"
						verticalPadding="10px"
						// value={messageField}
						// onChange={(event) => {
						// 	setMessageField(event.target.value);
						// }}
						// onKeyUp={(event) => {
						// 	if (event.code == "Enter") handleSendMessage();
						// }}
					></CTextField>
					<CIconButton
						// onClick={handleSendMessage}
						sx={{ my: "auto", ml: "10px" }}
					>
						<SendIcon fontSize="small" />
					</CIconButton>
				</Stack>
			</Stack>
		</CGamePaper>
	);
}

export default PGameChat;
