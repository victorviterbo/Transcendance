import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors } from "../../theme";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
import { colorAlterColor } from "../../../utils/styles";
const stripesIMG = "imgs/shared/BG_Lines.png";
const buttonHoverAnimation =
	"toggleButtonHoverBGAnimation " +
	(appAnimation.bg.buttonHover?.duration ? appAnimation.bg.buttonHover.duration : "10") +
	"s linear infinite";

export const CToggleGroupStyle: SxProps<Theme> = (theme) => ({
	backgroundColor: "rgba(23, 15, 56, 0.22)",
	border: "3px solid rgba(255, 255, 255, 0.82)",
	borderRadius: "999px",
	padding: theme.spacing(0.5),
	boxShadow: "0 8px 0 rgba(23, 15, 56, 0.24)",
	backdropFilter: "blur(12px)",
	overflow: "hidden",
	gap: theme.spacing(0.5),
	"& .MuiToggleButtonGroup-grouped": {
		margin: 0,
		border: 0,
		borderRadius: "999px",
	},
});

export const CToggleButtonStyle: SxProps<Theme> = (_) => ({
	position: "relative",
	minHeight: 44,
	paddingInline: "18px",
	backgroundColor: "transparent",
	color: "rgba(255, 255, 255, 0.84)",
	fontFamily: "DynaPuff, sans-serif",
	fontWeight: 700,
	letterSpacing: "0.04em",
	textTransform: "uppercase",
	overflow: "hidden",

	"& > *": {
		position: "relative",
		zIndex: 1,
	},

	"&::before": appAnimation.bg.buttonHover?.active
		? {
				content: '""',
				position: "absolute",
				inset: 0,
				zIndex: 0,
				opacity: 0,
				backgroundColor: colorAlterColor(appColors.primary[0], "shift-hue", 12),
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
				"@keyframes toggleButtonHoverBGAnimation": makeMaskTranslationAnim(
					appAnimation.bg.buttonHover.speed ? appAnimation.bg.buttonHover.speed : 100,
				),
				animation: "none",
			}
		: {},

	"&:hover": {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
	},

	"&:hover::before": appAnimation.bg.buttonHover?.active
		? {
				opacity: 0.18,
				animation: buttonHoverAnimation,
			}
		: {},

	"&.Mui-selected": {
		background: `linear-gradient(135deg, ${appColors.secondary[0]} 0%, ${appColors.primary[0]} 100%)`,
		color: appColors.text.dark,
		boxShadow: "inset 0 -3px 0 rgba(23, 15, 56, 0.24)",
	},

	"&.Mui-selected::before": appAnimation.bg.buttonHover?.active
		? {
				opacity: 0.32,
				animation: buttonHoverAnimation,
			}
		: {},

	"&:hover.Mui-selected": {
		background: `linear-gradient(135deg, ${appColors.secondary[0]} 0%, ${appColors.primary[0]} 100%)`,
	},

	transition: (theme) => {
		return theme.transitions.create(["transform", "box-shadow", "background", "color"], {
			duration: appAnimation.timing.medium_fast,
		});
	},
});
