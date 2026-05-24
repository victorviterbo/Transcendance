import { Box, Stack } from "@mui/material";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import type { GPageProps } from "../../common/GPageBases";
import { useMemo } from "react";
import {
	PGameRoundTrackerPinStyle,
	type IGameRoundTrackerPinStyle,
} from "../../../styles/pages/game/PGameRoundStyle";

interface PGameRoundTrackerPinProps extends GPageProps {
	type: "artist" | "title";
	percent: number;
}

function PGameRoundTrackerPin({ type, percent }: PGameRoundTrackerPinProps) {
	const style: IGameRoundTrackerPinStyle = useMemo(() => {
		return PGameRoundTrackerPinStyle();
	}, []);

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
			<Stack sx={style.top}>
				{type == "artist" && <MicExternalOnIcon />}
				{type == "title" && <AudiotrackIcon />}
			</Stack>
			<Box sx={style.bottom}></Box>
		</Stack>
	);
}

export default PGameRoundTrackerPin;
