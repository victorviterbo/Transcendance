import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors } from "../../theme";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
import { colorAlterColor } from "../../../utils/styles";
const stripesIMG = "imgs/shared/BG_Lines.png";
const buttonHoverAnimation =
	"tabsButtonHoverBGAnimation " +
	(appAnimation.bg.buttonHover?.duration ? appAnimation.bg.buttonHover.duration : "10") +
	"s linear infinite";

export const CTabsStyle: SxProps<Theme> = (_theme) => ({
	minHeight: 0,
	marginBottom: 28,
	padding: 6,
	borderRadius: "999px",
	backgroundColor: "rgba(23, 15, 56, 0.22)",
	border: "3px solid rgba(255, 255, 255, 0.72)",
	boxShadow: "0 8px 0 rgba(23, 15, 56, 0.18)",
	backdropFilter: "blur(14px)",
	"& .MuiTabs-indicator": {
		display: "none",
	},
	"& .MuiTabs-flexContainer": {
		gap: 8,
	},
});

export const CTabStyle: SxProps<Theme> = (_) => ({
	position: "relative",
	minHeight: 44,
	paddingInline: 18,
	borderRadius: "999px",
	color: "rgba(255, 255, 255, 0.76)",
	fontFamily: "DynaPuff, sans-serif",
	fontWeight: 700,
	letterSpacing: "0.04em",
	textTransform: "uppercase",
	overflow: "hidden",
	transition: "background 150ms ease, color 150ms ease, transform 150ms ease",
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
				"@keyframes tabsButtonHoverBGAnimation": makeMaskTranslationAnim(
					appAnimation.bg.buttonHover.speed ? appAnimation.bg.buttonHover.speed : 100,
				),
				animation: "none",
			}
		: {},
	"&:hover::before": appAnimation.bg.buttonHover?.active
		? {
				opacity: 0.18,
				animation: buttonHoverAnimation,
			}
		: {},
	"&.Mui-selected": {
		color: appColors.text.dark,
		background: `linear-gradient(135deg, ${appColors.secondary[0]} 0%, ${appColors.primary[0]} 100%)`,
		boxShadow: "inset 0 -3px 0 rgba(23, 15, 56, 0.22)",
	},
	"&.Mui-selected::before": appAnimation.bg.buttonHover?.active
		? {
				opacity: 0.32,
				animation: buttonHoverAnimation,
			}
		: {},
});
