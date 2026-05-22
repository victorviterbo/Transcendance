import { Box, Stack } from "@mui/material";
import CLinearProgress from "../../../components/feedback/loading/CLinearProgress";
import type { IGameRound, IGameSettings, IGameStatus } from "../../../types/game";
import { timeGetElapse } from "../../../utils/time";
import PGameRoundTrackerPin from "./PGameRoundTrackerPin";
import type { GPageProps } from "../../common/GPageBases";

interface PGameRoundTrackerProps extends GPageProps {
	settings: IGameSettings;
	status: IGameStatus;
	round: IGameRound;
}

function PGameRoundTracker({ settings, status, round }: PGameRoundTrackerProps) {
	console.log(round);

	return (
		<Stack direction={"column"}>
			<Box sx={{ position: "relative", height: "60px", mt: "10px" }}>
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
				value={timeGetElapse(status.keyTime, "miliseconds") / 1000}
				min={0}
				max={settings.timer}
			></CLinearProgress>
		</Stack>
	);
}

export default PGameRoundTracker;
