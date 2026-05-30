import { Stack } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import CSlider from "./CSlider";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownAltIcon from "@mui/icons-material/VolumeDownAlt";
import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { useState } from "react";
import { appColors } from "../../../styles/theme";

interface CVolumeSilderProps extends GCompProps {
	onVolumeChanged: (volume: number) => void;
}

function CVolumeSilder({ onVolumeChanged }: CVolumeSilderProps) {
	const [volume, setVolume] = useState<number>(50);

	return (
		<Stack sx={{ minWidth: "150px", pl: "30px", alignItems: "center" }} direction={"row"}>
			<CSlider
				sx={{ mr: "10px" }}
				min={0}
				max={100}
				step={1}
				valueLabelDisplay="auto"
				value={volume}
				onChange={(_: Event, value: number | number[]) => {
					let finalValue: number = Array.isArray(value) ? value[0] : value;
					if (finalValue < 0) finalValue = 0;
					else if (finalValue > 100) finalValue = 100;
					setVolume(finalValue);
					onVolumeChanged(finalValue);
				}}
			></CSlider>
			{volume == 0 && <VolumeOffIcon sx={{ color: appColors.cancel[0] }} />}
			{volume > 0 && volume <= 25 && <VolumeMuteIcon />}
			{volume > 25 && volume <= 75 && <VolumeDownAltIcon />}
			{volume > 75 && <VolumeUpIcon />}
		</Stack>
	);
}

export default CVolumeSilder;
