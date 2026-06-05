import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export interface IProfilePublicStyle {
	avatar: SxProps<Theme>;
}

export const PProfilePublicStyle = (): IProfilePublicStyle => ({
	avatar: {
		width: 88,
		height: 88,
		bgcolor: appColors.secondary[0],
		color: appColors.text.dark,
		fontWeight: "bold",
		fontSize: "2rem",
		flexShrink: 0,
	},
});
