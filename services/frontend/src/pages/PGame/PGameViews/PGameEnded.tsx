import { Stack } from "@mui/material";
import type { GPageProps } from "../../common/GPageBases";
import type { IGameRound, IGameSettings } from "../../../types/game";
import { useMemo, type ReactNode } from "react";
import PGameEndedRound from "./PGameEndedRound";

interface PGameEndedProps extends GPageProps {
	rounds: IGameRound[];
	settings: IGameSettings;
}

function PGameEnded({rounds, settings}: PGameEndedProps) {



	const roundList = useMemo((): ReactNode => {
		return rounds.map((round: IGameRound, index: number) => {
			return <PGameEndedRound key={"PGameEndedRound-" + index} round={round} settings={settings}  />
		})	
	}, [rounds, settings])

	return <Stack direction={"column"}>
		{roundList}
	</Stack>
}

export default PGameEnded;