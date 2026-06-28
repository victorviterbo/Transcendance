import { Stack, type SxProps, type Theme } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import CSlider from "./CSlider";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownAltIcon from "@mui/icons-material/VolumeDownAlt";
import VolumeMuteIcon from "@mui/icons-material/VolumeMute";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { appColors } from "../../../styles/theme";
import { sxMerger } from "../../../utils/styles";

interface CVolumeSilderProps extends GCompProps {
	volume: number;
	muted: boolean;
	sx?: SxProps<Theme>;
	onVolumeChanged: (volume: number) => void;
	onVolumeMuted: (volume: boolean) => void;
}

function CVolumeSilder({ sx, muted, volume, onVolumeChanged, onVolumeMuted }: CVolumeSilderProps) {
	return (
		<Stack
			sx={sxMerger(sx ? sx : {}, { minWidth: "150px", pl: "30px", alignItems: "center" })}
			direction={"row"}
		>
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
					onVolumeChanged(finalValue);
				}}
			></CSlider>
			<Stack
				direction={"row"}
				onClick={() => {
					muted = !muted;
					onVolumeMuted(muted);
				}}
			>
				{(muted || volume == 0) && <VolumeOffIcon sx={{ color: appColors.cancel[0] }} />}
				{!muted && volume > 0 && volume <= 25 && <VolumeMuteIcon />}
				{!muted && volume > 25 && volume <= 75 && <VolumeDownAltIcon />}
				{!muted && volume > 75 && <VolumeUpIcon />}
			</Stack>
		</Stack>
	);
}

export default CVolumeSilder;
