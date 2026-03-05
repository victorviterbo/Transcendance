import type { SxProps, Theme } from "@mui/material";
import { appThemeDef } from "../theme";
import { TDropShadowToString } from "../../utils/styles";
import { ARotation, makeMaskTranslationAnim } from "../animations/CommonAnimations";
const bgIcons = "imgs/shared/BG_Icons.png";
const bgPolar = "imgs/shared/BGPolarMask.png";

export const SBGBox: SxProps<Theme> = {
	position: "fix",

	height: "100%",
	width: "100%",
};

export const SBGBaseColor: SxProps<Theme> = (Theme) => ({
	position: "absolute",

	height: "100%",
	width: "100%",

	backgroundColor: Theme.palette.primary.main,
});

export const SBGIconTextureBox: SxProps<Theme> = {
	position: "absolute",
	inset: 0,
	filter: appThemeDef.bg.iconShadow
		? "drop-shadow(" + TDropShadowToString(appThemeDef.bg.iconShadow) + ")"
		: "",
};

export function SBGIconMask(isWindmill?: boolean): SxProps<Theme> {
	return (Theme) => ({
		position: "absolute",
		inset: 0,

		backgroundColor: isWindmill ? Theme.palette.primary.dark : appThemeDef.colors.primary[3],
		maskImage: `url("${bgIcons}")`,
		maskSize: appThemeDef.bg.iconSize + "px " + appThemeDef.bg.iconSize + "px",

		WebkitMaskImage: `url("${bgIcons}")`,
		WebkitMaskSize: appThemeDef.bg.iconSize + "px " + appThemeDef.bg.iconSize + "px",

		"@keyframes tran": makeMaskTranslationAnim(
			appThemeDef.bg.iconSize ? appThemeDef.bg.iconSize : 1000,
		),
		animation: appThemeDef.bg.iconMove
			? "tran " + appThemeDef.bg.iconSpeed + "s linear infinite"
			: "",
	});
}

export const SBGWindmillBox: SxProps<Theme> = {
	position: "absolute",
	width: "125%",
	top: 0,
	left: 0,
	aspectRatio: "1 / 1",
	filter: appThemeDef.bg.windmillShadow
		? "drop-shadow(" + TDropShadowToString(appThemeDef.bg.windmillShadow) + ")"
		: "",

	transform: "translate(-10%, -30%)",
};

export const SBGWindmillMask: SxProps<Theme> = (Theme) => ({
	position: "absolute",
	inset: 0,
	backgroundColor: Theme.palette.primary.light,

	maskImage: `url(${bgPolar})`,
	maskSize: "contain",
	maskPosition: "center",

	WebkitMaskImage: `url(${bgPolar})`,
	WebkitMaskSize: "contain",
	WebkitMaskPosition: "center",

	"@keyframes rot": ARotation,
	animation: appThemeDef.bg.windmillMove
		? "rot " + appThemeDef.bg.windmillSpeed + "s linear infinite"
		: "",
});
