import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors, appPositions, appSharedStyle } from "../../theme";
import { colorAlterColor } from "../../../utils/styles";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
const stripesIMG = "imgs/shared/BG_Lines.png";
const buttonHoverAnimation =
	"buttonHoverBGAnimation " +
	(appAnimation.bg.buttonHover?.duration ? appAnimation.bg.buttonHover.duration : "10") +
	"s linear infinite";

export const CNavbarStyle: SxProps<Theme> = (_) => ({
	background: "transparent",
	boxShadow: "none",
	padding: {
		xs: "12px 12px 0",
		md: "18px 24px 0",
	},
	"& .MuiToolbar-root": {
		width: "min(100%, 1220px)",
		margin: "0 auto",
		padding: {
			xs: "10px 14px",
			md: "12px 18px",
		},
		minHeight: "unset",
		gap: 16,
		flexWrap: "wrap",
		borderRadius: "999px",
		border: "3px solid rgba(255, 255, 255, 0.78)",
		background: appSharedStyle.bg.header ? appSharedStyle.bg.header : appSharedStyle.bg.paper,
		boxShadow:
			"0 10px 0 rgba(23, 15, 56, 0.22), 0 22px 40px rgba(23, 15, 56, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
		backdropFilter: "blur(18px)",
	},
});

export const CNavbarLinkStyle = (active: boolean): SxProps => {
	return {
		display: "inline-flex",
		position: "relative",

		height: appPositions.sizes.buttons.nav,
		px: {
			xs: 1.5,
			md: 2,
		},
		m: 0,
		gap: 1,
		borderRadius: "999px",
		border: "3px solid rgba(255, 255, 255, 0.82)",
		background: active
			? `linear-gradient(135deg, ${appColors.secondary[0]} 0%, ${appColors.primary[0]} 100%)`
			: "rgba(23, 15, 56, 0.18)",
		boxShadow: active ? "0 6px 0 rgba(23, 15, 56, 0.28)" : "0 6px 0 rgba(23, 15, 56, 0.14)",
		color: active ? appColors.text.dark : appColors.text.light,
		alignItems: "center",
		textDecoration: "none",
		fontFamily: "DynaPuff, sans-serif",
		fontWeight: 700,
		fontSize: {
			xs: "0.8rem",
			md: "0.9rem",
		},
		letterSpacing: "0.04em",
		textTransform: "uppercase",
		whiteSpace: "nowrap",
		overflow: "hidden",
		transition:
			"transform " +
			appAnimation.timing.medium_fast +
			"ms ease, background " +
			appAnimation.timing.medium_fast +
			"ms ease, box-shadow " +
			appAnimation.timing.medium_fast +
			"ms ease, color " +
			appAnimation.timing.medium_fast +
			"ms ease",

		"&:hover": {
			background: active
				? `linear-gradient(135deg, ${appColors.secondary[0]} 0%, ${appColors.primary[0]} 100%)`
				: "rgba(23, 15, 56, 0.28)",
			transform: "translateY(1px)",
		},

		"& > *": {
			zIndex: 1,
		},
		"& svg": {
			fontSize: "1.05rem",
		},

		"&::before": appAnimation.bg.buttonHover?.active
			? {
					content: '""',
					position: "absolute",
					inset: 0,
					zIndex: 0,
					opacity: active ? 0.42 : 0,
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
					"@keyframes buttonHoverBGAnimation": makeMaskTranslationAnim(
						appAnimation.bg.buttonHover.speed ? appAnimation.bg.buttonHover.speed : 100,
					),
					animation: active ? buttonHoverAnimation : "none",
					transition:
						"opacity " +
						appAnimation.timing.medium_fast +
						"ms ease, background-color " +
						appAnimation.timing.medium_fast +
						"ms ease",
				}
			: {},
		"&:hover::before, &:focus-visible::before": appAnimation.bg.buttonHover?.active
			? {
					opacity: active ? 0.42 : 0.24,
					animation: buttonHoverAnimation,
					backgroundColor: colorAlterColor(
						active ? appColors.primary[0] : appColors.secondary[0],
						"shift-hue",
						active ? 12 : -15,
					),
				}
			: {},
	};
};
