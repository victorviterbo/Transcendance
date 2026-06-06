import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export interface IProfileTextStyle {
	secondary: SxProps<Theme>;
	error: SxProps<Theme>;
}

export const PProfileTextStyle = (): IProfileTextStyle => ({
	secondary: {
		color: appColors.greys[1],
	},
	error: {
		color: appColors.cancel[0],
	},
});
