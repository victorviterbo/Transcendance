import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors, appSharedStyle } from "../../theme";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
import { colorAlterColor } from "../../../utils/styles";
const stripesIMG = "imgs/shared/BG_Lines.png";
const buttonHoverAnimation =
	"buttonHoverBGAnimation " +
	(appAnimation.bg.buttonHover?.duration ? appAnimation.bg.buttonHover.duration : "10") +
	"s linear infinite";

export const CButtonStyle: SxProps<Theme> = (theme) => ({
	position: "relative",
	transition: (theme) => {
		return theme.transitions.create(["transform", "box-shadow", "background", "color"], {
			duration: appAnimation.timing.medium_fast,
		});
	},

	minHeight: 48,
	paddingInline: theme.spacing(3),
	borderRadius: "999px",
	border: "3px solid rgba(255, 255, 255, 0.9)",
	background: `linear-gradient(135deg, ${appColors.tertiary[0]} 0%, ${appColors.secondary[0]} 100%)`,
	transform: "translateY(0px)",
	boxShadow:
		"0 8px 0 rgba(23, 15, 56, 0.34), 0 14px 24px rgba(23, 15, 56, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
	color: appColors.text.dark,
	fontFamily: "DynaPuff, sans-serif",
	fontWeight: 700,
	letterSpacing: "0.04em",
	textTransform: "uppercase",
	overflow: "hidden",

	"& > *": {
		zIndex: 1,
	},

	"&:hover": {
		background: `linear-gradient(135deg, ${appColors.secondary[0]} 0%, ${appColors.primary[0]} 100%)`,
		transform: "translateY(3px) scale(1.01)",
		boxShadow:
			"0 4px 0 rgba(23, 15, 56, 0.34), 0 10px 16px rgba(23, 15, 56, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
		color: appColors.text.dark,
	},

	"&:active": {
		transform: "translateY(5px)",
		boxShadow: "0 2px 0 rgba(23, 15, 56, 0.28)",
	},

	"&.Mui-disabled": {
		opacity: 0.6,
		color: "rgba(23, 15, 56, 0.72)",
		boxShadow: "0 6px 0 rgba(23, 15, 56, 0.18)",
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
				animation: "none",
				opacity: 0,
				transition: (theme) => {
					return theme.transitions.create(["opacity", "background-color", "transform"], {
						duration: appAnimation.timing.medium_fast,
					});
				},
			}
		: {},

	"&:hover::before, &:focus-visible::before, &:active::before": appAnimation.bg.buttonHover
		?.active
		? {
				animation: buttonHoverAnimation,
				opacity: 0.36,
				backgroundColor: colorAlterColor(appColors.secondary[0], "shift-hue", -15),
			}
		: {},
});

export const CIconButtonStyle: SxProps<Theme> = (_) => ({
	minWidth: 48,
	width: 48,
	height: 48,
	px: 0,
	py: 0,
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
