import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const PGameRoundTrackerPinTopStyle = (): SxProps<Theme> => {
	return {
		height: "35px",
		width: "35px",
		p: "5px",
		borderRadius: appSharedStyle.gameRadius,
		backgroundColor: appColors.primary[0],
	};
};

export const PGameRoundTrackerPinBottomStyle = (): SxProps<Theme> => {
	return {
		width: "3px",
		height: "25px",
		backgroundColor: appColors.primary[0],
	};
};
