import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors, appPositions, appSharedStyle } from "../../theme";
import { colorAlterColor } from "../../../utils/styles";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
const stripesIMG = "imgs/shared/BG_Lines.png";

export const CNavbarStyle: SxProps<Theme> = (_) => ({
	background: appSharedStyle.bg.header ? appSharedStyle.bg.header : appSharedStyle.bg.paper,
});

export const CNavbarLinkStyle = (active: boolean): SxProps => {
	return {
		display: "inline-flex",
		position: "relative",

		height: appPositions.sizes.buttons.nav,
		px: 1.5,

		m: 0,

		gap: 1,

		borderRadius: 1,
		//border: "solid " +  (active ? 3 : 0) +  "px" + appColors.text.light,
		backgroundColor: active ? appColors.primary[0] : appColors.primary[1],

		color: "inherit",
		alignItems: "center",
		textDecoration: "none",

		overflow: "hidden",

		"&:hover": {
			backgroundColor: active ? appColors.primary[0] : appColors.primary[0],
		},

		"& > *": {
			zIndex: 1,
		},

		"&::before":
			appAnimation.bg.buttonHover?.active && active
				? {
						content: '""',
						position: "absolute",
						inset: 0,
						zIndex: 0,

						opacity: 1,

						backgroundColor: colorAlterColor(appColors.primary[0], "shift-hue", 15),

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
