import { Grid, Stack } from "@mui/material";
import GPageBase from "../common/GPageBases";
import { appColors, appPositions } from "../../styles/theme";
//import { useRef } from "react";
import PGameLBoard from "./PGameLBoard";
import PGameLobby from "./PGameLobby";
import PGameChat from "./PGameChat";
import { useEffect, useState } from "react";
import type { IGameData } from "../../types/game";
import { useWS } from "../../components/websocket/CWebsocket";
import { gameGetRoom } from "../../api/game";
import CGamePaper from "../../components/surfaces/CGamePaper";
import CText from "../../components/text/CText";
import type { TWSRcv } from "../../types/websocket";

function PGame() {
	//const roomId: number = useRef<number>(123456);
	const spacing: number = appPositions.gameSpacing;
	const [gameData, setGameData] = useState<IGameData | undefined>()
	const [roomId] = useState<string | undefined >(gameGetRoom());
	const wsContext = useWS("game");
	
	useEffect(() => {
		if(!roomId)
			return; 
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | undefined = wsContext.getLast();
			}
		});

		
	}, [wsContext, roomId]);


	if(roomId == undefined)
	{
		return <GPageBase>
			<CGamePaper contentFlex={1} sx={{position: "relative", maxWidth: "500px", maxHeight: "150px", mt: "50px", mx: "auto"}} title={"GAME_ERROR_TITLE"}>
				<CText align="center" sx={{my: "auto", color: appColors.cancel[0]}}>GAME_ERROR_INVALID_ROOM</CText>
			</CGamePaper>
		</GPageBase>
	}

	return (
		<GPageBase>
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
		</GPageBase>
	);
}

export default PGame;
