import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export const CToolButtonStyle: SxProps<Theme> = {
	width: 30,
	height: 30,
	p: 0,
	background: "transparent",
	boxShadow: "none",
	color: appColors.text.dark,
	"&:hover": {
		background: "rgba(0, 0, 0, 0.12)",
		boxShadow: "none",
	},
	"&:disabled": {
		background: "transparent",
		color: appColors.greys[5],
	},
};
