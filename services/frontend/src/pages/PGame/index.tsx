import { Grid, Stack } from "@mui/material";
import { appColors, appPositions } from "../../styles/theme";
//import { useRef } from "react";
import PGameLBoard from "./PGameLBoard";
import PGameLobby from "./PGameLobby";
import PGameChat from "./PGameChat";
import { useEffect, useState, type ReactNode } from "react";
import type { IGameData, IGameDataRes } from "../../types/game";
import { useWS } from "../../components/websocket/CWebsocket";
import { gameFetchData, gameGetRoom } from "../../api/game";
import CGamePaper from "../../components/surfaces/CGamePaper";
import CText from "../../components/text/CText";
import type { TWSRcv, TWSSend } from "../../types/websocket";
import { API_GAME } from "../../constants";
import {
	gameOnPlayerJoin,
	gameOnPlayerLeave,
	gameOnPlayerUpdate,
} from "../../handlers/gameHandlers";

function PGame() {
	const spacing: number = appPositions.gameSpacing;
	const [gameData, setGameData] = useState<IGameData | undefined>();
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const [gameID] = useState<string | undefined>(gameGetRoom());
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
		);
	}, [setGameData, gameID]);

	//====================== WS ======================
	useEffect(() => {
		if (!gameID) return;
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | undefined = wsContext.getLast();
				if (!last || last.target != "game" || !gameData) return;
				if (last.event == "player-join") gameOnPlayerJoin(gameData, last.player);
				if (last.event == "player-leave") gameOnPlayerLeave(gameData, last.player);
				if (last.event == "players-update") gameOnPlayerUpdate(gameData, last.players);
			}
		});
	}, [wsContext, gameID, gameData]);

	useEffect(() => {
		wsContext.sendMessage(
			JSON.stringify({ target: "game", event: "join", gameid: gameID } as TWSSend),
		);
	}, [wsContext, gameID]);

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
					<PGameLBoard game={gameData} />
				</Grid>
				<Grid size={6}>
					<PGameLobby />
				</Grid>
				<Grid size={3}>
					<PGameChat game={gameData} />
				</Grid>
			</Grid>
		</Stack>
	);
}

export default PGame;
