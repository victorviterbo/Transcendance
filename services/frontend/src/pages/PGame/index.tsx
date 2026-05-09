import { Grid, Stack } from "@mui/material";
import { appColors, appPositions } from "../../styles/theme";
//import { useRef } from "react";
import PGameLBoard from "./PGameLBoard";
import PGameChat from "./PGameChat";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { IGameChatMsg, IGameData, IGameDataRes, IGamePlayer } from "../../types/game";
import { useWS } from "../../components/websocket/CWebsocket";
import { gameFetchData, gameGetRoom } from "../../api/game";
import CGamePaper from "../../components/surfaces/CGamePaper";
import CText from "../../components/text/CText";
import type { TWSRcv, TWSSend } from "../../types/websocket";
import { API_GAME } from "../../constants";
import {
	gameOnMessageNew,
	gameOnMessageUpdate,
	gameOnPlayerJoin,
	gameOnPlayerLeave,
	gameOnPlayerUpdate,
} from "../../handlers/gameHandlers";
import PGameViews from "./PGameViews";

function PGame() {
	//STYLING
	const spacing: number = appPositions.gameSpacing;

	//ERROR
	const [error, setError] = useState<ReactNode | undefined>(undefined);

	//GAME
	const [gameID] = useState<string | undefined>(gameGetRoom());
	const [gameData, setGameData] = useState<IGameData | undefined>();

	//Updatable Data
	const [users, setUsers] = useState<IGamePlayer[]>([]);
	const [chat, setChat] = useState<IGameChatMsg[]>([]);

	//WS
	const wsContext = useWS("game");

	//====================== HTTP ======================
	useEffect(() => {
		if (gameID == undefined) return;
		gameFetchData<IGameData | undefined, IGameDataRes, "game">(
			API_GAME.replaceAll("{ROOMID}", gameID),
			"game",
			setGameData,
			setError,
			undefined,
			"GAME_ERROR_GLOBAL",
			(data: IGameData | undefined) => {
				if (!data) return;
				setUsers(data.players);
				setChat(data.chat);
			},
		);
	}, [setGameData, gameID]);

	//====================== WS ======================
	const sendWSMessage = useCallback(
		(sentData: Omit<TWSSend, "target">) => {
			if (!gameData) return;
			const retData = {
				target: "game",
				gameid: gameData.id,
				gameuid: gameData.uid,
				...sentData,
			};
			wsContext.sendMessage(JSON.stringify(retData));
		},
		[gameData, wsContext],
	);

	useEffect(() => {
		if (!gameID) return;
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | undefined = wsContext.getLast();
				if (!last || last.target != "game" || !gameData) return;
				else if (last.event == "player-join")
					gameOnPlayerJoin(gameData, last.player, setUsers);
				else if (last.event == "player-leave")
					gameOnPlayerLeave(gameData, last.player, setUsers);
				else if (last.event == "players-update")
					gameOnPlayerUpdate(gameData, last.players, setUsers);
				else if (last.event == "message-new")
					gameOnMessageNew(gameData, last.message, setChat);
				else if (last.event == "message-update")
					gameOnMessageUpdate(gameData, last.messages, setChat);
			}
		});
	}, [wsContext, gameID, gameData]);

	useEffect(() => {
		if (!gameData) return;
		const nSentData: TWSSend = {
			target: "game",
			event: "join",
			gameid: gameData.id,
			gameuid: gameData.uid,
		};
		sendWSMessage(nSentData);
	}, [gameData, sendWSMessage]);

	//====================== BUILD ======================
	//--------------------- EROR ---------------------
	if (gameID == undefined || error) {
		return (
			<CGamePaper
				contentFlex={1}
				sx={{
					position: "relative",
					maxWidth: "500px",
					maxHeight: "150px",
					mt: "50px",
					mx: "auto",
				}}
				title={"GAME_ERROR_TITLE"}
			>
				{gameID == undefined ? (
					<CText align="center" sx={{ my: "auto", color: appColors.cancel[0] }}>
						GAME_ERROR_INVALID_ROOM
					</CText>
				) : (
					error
				)}
			</CGamePaper>
		);
	}

	//--------------------- LOADIN ---------------------
	if (!gameData) {
		return (
			<CGamePaper
				contentFlex={1}
				sx={{
					position: "relative",
					maxWidth: "500px",
					maxHeight: "150px",
					mt: "50px",
					mx: "auto",
				}}
				title={"GAME_LOADING_TITLE"}
			>
				<CText align="center" sx={{ my: "auto" }}>
					GAME_LOADING
				</CText>
			</CGamePaper>
		);
	}

	//--------------------- FINAL ---------------------
	return (
		<Stack
			sx={{
				position: "absolute",
				inset: 0,
			}}
		>
			<Grid
				container
				spacing={spacing}
				sx={{
					position: "absolute",
					inset: 0,
					p: spacing,
				}}
			>
				<Grid size={3}>
					<PGameLBoard users={users} />
				</Grid>
				<Grid size={6}>
					<PGameViews players={users} game={gameData} />
				</Grid>
				<Grid size={3}>
					<PGameChat sendWSMessage={sendWSMessage} users={users} chat={chat} />
				</Grid>
			</Grid>
		</Stack>
	);
}

export default PGame;
