import { Box, Stack } from "@mui/material";
import CLinearProgress from "../../../components/feedback/loading/CLinearProgress";
import type { IGameRound, IGameSettings, IGameStatus } from "../../../types/game";
import { timeGetElapse } from "../../../utils/time";
import PGameRoundTrackerPin from "./PGameRoundTrackerPin";
import type { GPageProps } from "../../common/GPageBases";
import {
	PGameRoundTrackerStyle,
	type IGameRoundTrackerStyle,
} from "../../../styles/pages/game/PGameRoundStyle";
import { useMemo } from "react";

interface PGameRoundTrackerProps extends GPageProps {
	settings: IGameSettings;
	status: IGameStatus;
	round: IGameRound;
}

function PGameRoundTracker({ settings, status, round }: PGameRoundTrackerProps) {
	const style: IGameRoundTrackerStyle = useMemo(() => {
		return PGameRoundTrackerStyle();
	}, []);

	return (
		<Stack direction={"column"} sx={{ mb: "10px", mt: "20px" }}>
			<Box sx={style.pinbox}>
				<PGameRoundTrackerPin
					type="artist"
					percent={(round.artistFound / settings.timer) * 100}
				/>
				<PGameRoundTrackerPin
					type="title"
					percent={(round.titleFound / settings.timer) * 100}
				/>
			</Box>
			<CLinearProgress
				sx={style.bar}
				value={timeGetElapse(status.keyTime, "miliseconds") / 1000}
				min={0}
				max={settings.timer}
			></CLinearProgress>
		</Stack>
	);
}

export default PGameRoundTracker;
