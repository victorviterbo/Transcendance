import type { SxProps, Theme } from "@mui/material";
import { appAnimation, appColors } from "../../theme";
import { makeMaskTranslationAnim } from "../../animations/CommonAnimations";
import { colorAlterColor } from "../../../utils/styles";
const stripesIMG = "imgs/shared/BG_Lines.png";

export const CToggleButtonStyle: SxProps<Theme> = (_) => ({
	backgroundColor: appColors.tertiary[0],
	color: appColors.text.light,
	boxShadow: "0px 5px 0px 0px " + appColors.greys[0],
	//border: "solid 3px " + appColors.greys[0],
	overflow: "hidden",

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
		backgroundColor: appColors.secondary[0],
	},

	"&.Mui-selected::before": appAnimation.bg.buttonHover?.active
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
					appAnimation.bg.buttonHover.speed ? appAnimation.bg.buttonHover.speed : 100,
				),
				animation:
					"buttonHoverBGAnimation " +
					(appAnimation.bg.buttonHover.duration
						? appAnimation.bg.buttonHover.duration
						: "10") +
					"s linear infinite",
			}
		: {},

	"& > *": {
		zIndex: 1,
	},

	transition: (theme) => {
		return theme.transitions.create(["transform", "box-shadow", "background", "color"], {
			duration: appAnimation.timing.fast,
		});
	},
});
