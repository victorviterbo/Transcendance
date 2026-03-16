import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors, appSharedStyle } from "../../theme";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
import { colorAlterColor } from "../../../utils/styles";
const stripesIMG = "imgs/shared/BG_Lines.png";

export const CButtonStyle: SxProps<Theme> = (theme) => ({
	transition: (theme) => {
		return theme.transitions.create(["transform", "box-shadow", "background", "color"], {
			duration: appAnimation.timing.fast,
		});
	},

	background: appColors.tertiary[0],
	transform: "translateY(0px)",
	boxShadow: "0px 5px 0px 0px " + appColors.greys[1],
	color: theme.palette.grey[100],

	overflow: "hidden",
	//border: "solid 3px " + appColors.greys[0],

	"& > *": {
		zIndex: 1,
	},

	"&:hover": {
		background: appColors.secondary[0],
		transform: "translateY(5px)",
		boxShadow: "0px 0px 0px 0px " + appColors.greys[0],
		color: theme.palette.grey[900],
	},

	"&::before": appAnimation.bg.buttonHover?.active
		? {
				content: '""',
				position: "absolute",
				inset: 0,
				zIndex: 0,

				backgroundColor: appColors.tertiary[0],

				maskImage: `url(${stripesIMG})`,
				maskSize: appAnimation.bg.buttonHover.size
					? appAnimation.bg.buttonHover.size +
						(typeof appAnimation.bg.buttonHover.size == "string" ? "" : "px")
					: "200%",

				WebkitMaskImage: `url(${stripesIMG})`,
				WebkitMaskSize: appAnimation.bg.buttonHover.size
					? appAnimation.bg.buttonHover.size +
						(typeof appAnimation.bg.buttonHover.size == "string" ? "" : "px")
					: "200%",

				"@keyframes buttonHoverBGAnimation": makeMaskTranslationAnim(
					appAnimation.bg.buttonHover.speed ? appAnimation.bg.buttonHover.speed : 100,
				),
				animation:
					"buttonHoverBGAnimation " +
					(appAnimation.bg.buttonHover.duration
						? appAnimation.bg.buttonHover.duration
						: "10") +
					"s linear infinite",

				opacity: 0,
				transition: (theme) => {
					return theme.transitions.create(["opacity", "background-color"], {
						duration: appAnimation.timing.fast,
					});
				},
			}
		: {},

	"&:hover::before": appAnimation.bg.buttonHover?.active
		? {
				opacity: 1,
				backgroundColor: colorAlterColor(appColors.secondary[0], "shift-hue", -15),
			}
		: {},
});

export const CIconButtonStyle: SxProps<Theme> = (_) => ({
	px: 1.75,
	py: 0.75,
	borderRadius: appSharedStyle.radius + "px",
});

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
