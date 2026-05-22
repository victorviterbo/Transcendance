import { Box, Stack } from "@mui/material";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import type { GPageProps } from "../../common/GPageBases";
import {
	PGameRoundTrackerPinBottomStyle,
	PGameRoundTrackerPinTopStyle,
} from "../../../styles/pages/game/PGameRoundTrackerStyle";

interface PGameRoundTrackerPinProps extends GPageProps {
	type: "artist" | "title";
	percent: number;
}

function PGameRoundTrackerPin({ type, percent }: PGameRoundTrackerPinProps) {
	return (
		<Stack
			direction={"column"}
			sx={{
				alignItems: "center",
				position: "absolute",
				top: "0",
				left: "calc(" + percent + "% - 35px / 2)",
			}}
		>
			<Stack sx={PGameRoundTrackerPinTopStyle()}>
				{type == "artist" && <MicExternalOnIcon />}
				{type == "title" && <AudiotrackIcon />}
			</Stack>
			<Box sx={PGameRoundTrackerPinBottomStyle()}></Box>
		</Stack>
	);
}

export default PGameRoundTrackerPin;
