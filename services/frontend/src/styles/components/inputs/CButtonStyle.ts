import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors } from "../../theme";

const CButtonStyle: SxProps<Theme> = (theme) => ({
	transition: (theme) => {
		return theme.transitions.create(["transform", "box-shadow", "background", "color"], {
			duration: appAnimation.timing.fast,
		});
	},

	background: appColors.tertiary[0],
	transform: "translateY(0px)",
	boxShadow: "0px 5px 0px 0px " + appColors.greys[0],
	color: theme.palette.grey[100],

	"&:hover": {
		background: appColors.secondary[0],
		transform: "translateY(5px)",
		boxShadow: "0px 0px 0px 0px " + appColors.greys[0],
		color: theme.palette.grey[900],
	},
});

export default CButtonStyle;

//--------------------------------------------------
//                      ARCHIVES
//--------------------------------------------------
// colorGetBackground(
// 	[appColors.tertiary[0], colorAlterColor(appColors.tertiary[1], "shift-brightness", -0.1)],
// 	undefined,
// 	"radial",
// ),
//border: "solid 3px " + theme.palette.secondary.light,
//  background: colorGetBackground(
// 	[appColors.secondary[0], colorAlterColor(appColors.secondary[1], "shift-brightness", -0.1)],
// 	undefined,
// 	"radial",
// ),
//border: "solid 3px " + theme.palette.secondary.light,
