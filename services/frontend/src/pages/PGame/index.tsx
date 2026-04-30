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
import type { TWSRcv } from "../../types/websocket";
import { API_GAME } from "../../constants";

function PGame() {
	
	const spacing: number = appPositions.gameSpacing;
	const [gameData, setGameData] = useState<IGameData | undefined>()
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const [roomId] = useState<string | undefined >(gameGetRoom());
	const wsContext = useWS("game");
	

	//====================== HTTP ======================
	useEffect(() => {
		if(roomId == undefined)
			return;
		gameFetchData<IGameData | undefined, IGameDataRes, "game">(API_GAME.replaceAll("{ROOMID}", roomId), "game", setGameData, setError, undefined, "GAME_ERROR_GLOBAL")
	}, [setGameData, roomId])

	//====================== WS ======================
	useEffect(() => {
		if(!roomId)
			return; 
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | undefined = wsContext.getLast();
			}
		});
		
	}, [wsContext, roomId]);

	if(roomId == undefined || error)
	{
		return(
			<CGamePaper contentFlex={1} sx={{position: "relative", maxWidth: "500px", maxHeight: "150px", mt: "50px", mx: "auto"}} title={"GAME_ERROR_TITLE"}>
				{roomId == undefined ? <CText align="center" sx={{my: "auto", color: appColors.cancel[0]}}>GAME_ERROR_INVALID_ROOM</CText> : error}
			</CGamePaper>
		)
	}

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
					<PGameLBoard />
				</Grid>
				<Grid size={6}>
					<PGameLobby />
				</Grid>
				<Grid size={3}>
					<PGameChat />
				</Grid>
			</Grid>
		</Stack>
	);
}

export default PGame;
