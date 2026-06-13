import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors, appPositions, appSharedStyle } from "../../theme";
import { colorAlterColor, sizeMakeString } from "../../../utils/styles";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
const stripesIMG = "/imgs/shared/BG_Lines.png";

export const CNavbarStyle: SxProps<Theme> = (_) => ({
	background: appSharedStyle.bg.header ? appSharedStyle.bg.header : appSharedStyle.bg.paper,
	height: sizeMakeString(appPositions.sizes.header),
	minHeight: sizeMakeString(appPositions.sizes.header),
	"& .MuiToolbar-root": {
		height: "100%",
		minHeight: "inherit !important",
		alignItems: "center",
		py: 0,
	},
	"& .CNavbarHomeButton": {
		alignSelf: "center",
		flexShrink: 0,
	},
});

export const CNavbarLinkStyle = (active: boolean): SxProps => {
	return {
		display: "inline-flex",
		position: "relative",

		height: appPositions.sizes.buttons.nav,
		width: { xs: "48px", md: "auto" },
		px: { xs: 0, md: 1.5 },

		m: 0,

		gap: { xs: 0, md: 1 },

		borderRadius: appSharedStyle.radius + "px",
		backgroundColor: active ? appColors.secondary[0] : appColors.tertiary[0],
		transform: active ? "translateY(5px)" : "translateY(0px)",
		boxShadow: active
			? "0px 0px 0px 0px " + appColors.greys[0]
			: "0px 5px 0px 0px " + appColors.greys[0],

		color: active ? appColors.text.dark : appColors.text.light,
		alignItems: "center",
		justifyContent: "center",
		textDecoration: "none",

		overflow: "hidden",

		"&:hover": {
			backgroundColor: active ? appColors.secondary[0] : appColors.tertiary[1],
		},

		"& > *": {
			zIndex: 1,
		},

		"& .CNavbarLink-label": {
			display: { xs: "none", md: "inline" },
		},

		"&::before":
			appAnimation.bg.buttonHover?.active && active
				? {
						content: '""',
						position: "absolute",
						inset: 0,
						zIndex: 0,

						opacity: 1,

						backgroundColor: colorAlterColor(appColors.secondary[0], "shift-hue", -15),

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
							appAnimation.bg.buttonHover.speed
								? appAnimation.bg.buttonHover.speed
								: 100,
						),
						animation:
							"buttonHoverBGAnimation " +
							(appAnimation.bg.buttonHover.duration
								? appAnimation.bg.buttonHover.duration
								: "10") +
							"s linear infinite",
					}
				: {},
	};
};
