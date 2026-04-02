import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export const CRadioGroupRadioStyle: SxProps<Theme> = (_) => ({
	color: appColors.greys[8],

	"&.Mui-checked": {
		color: appColors.secondary[0],
	},
});
