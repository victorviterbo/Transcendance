import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors } from "../../theme";

export const CToggleButtonStyle: SxProps<Theme> = (_) => ({
	backgroundColor: appColors.tertiary[0],
	color: appColors.text.light,
	boxShadow: "0px 5px 0px 0px " + appColors.greys[0],

	"&:hover": {
		backgroundColor: appColors.tertiary[1],
	},

	"&.Mui-selected": {
		backgroundColor: appColors.secondary[0],
		color: appColors.text.dark,
		boxShadow: "0px 0px 0px 0px " + appColors.greys[0],
		transform: "translateY(5px)",
	},

	"&:hover.Mui-selected": {
		backgroundColor: appColors.secondary[1],
	},

	transition: (theme) => {
		return theme.transitions.create(["transform", "box-shadow", "background", "color"], {
			duration: appAnimation.timing.fast,
		});
	},
});
