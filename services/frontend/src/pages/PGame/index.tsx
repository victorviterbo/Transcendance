import { Grid, Stack } from "@mui/material";
import GPageBase from "../common/GPageBases";
import { appPositions } from "../../styles/theme";
//import { useRef } from "react";
import PGameLBoard from "./PGameLBoard";
import PGameLobby from "./PGameLobby";
import PGameChat from "./PGameChat";
import { useState } from "react";
import type { IGameData } from "../../types/game";

function PGame() {
	//const roomId: number = useRef<number>(123456);
	const spacing: number = appPositions.gameSpacing;
	const [gameData, setGameData] = useState<IGameData | undefined>()


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
