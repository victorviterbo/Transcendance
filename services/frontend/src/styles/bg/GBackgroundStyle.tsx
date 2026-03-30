import type { SxProps, Theme } from "@mui/material";
import { appBG } from "../theme";
import { TDropShadowToString } from "../../utils/styles";
import { ARotation, makeMaskTranslationAnim } from "../animations/CommonAnimations";
const bgIcons = "/imgs/shared/BG_Icons.png";
const bgPolar = "/imgs/shared/BGPolarMask.png";

export const SBGBox: SxProps<Theme> = {
	position: "fixed",
	inset: 0,
	filter: "blur(" + appBG.baseBlur + "px)",
};

export const SBGBaseColor: SxProps<Theme> = (_) => ({
	position: "absolute",

	height: "100%",
	width: "100%",

	background: appBG.baseColor,
});

export const SBGIconTextureBox: SxProps<Theme> = {
	position: "absolute",
	inset: 0,
	filter: appBG.iconShadow ? "drop-shadow(" + TDropShadowToString(appBG.iconShadow) + ")" : "",
};

export function SBGIconMask(isWindmill?: boolean): SxProps<Theme> {
	return (Theme) => ({
		position: "absolute",
		inset: 0,

		background: isWindmill ? Theme.palette.primary.dark : appBG.iconColor,
		maskImage: `url("${bgIcons}")`,
		maskSize: appBG.iconSize + "px " + appBG.iconSize + "px",

		WebkitMaskImage: `url("${bgIcons}")`,
		WebkitMaskSize: appBG.iconSize + "px " + appBG.iconSize + "px",

		"@keyframes tran": makeMaskTranslationAnim(appBG.iconSize ? appBG.iconSize : 1000),
		animation: appBG.iconMove ? "tran " + appBG.iconSpeed + "s linear infinite" : "",
	});
}

export const SBGWindmillBox: SxProps<Theme> = {
	position: "absolute",
	width: "125%",
	top: 0,
	left: 0,
	aspectRatio: "1 / 1",
	filter: appBG.windmillShadow
		? "drop-shadow(" + TDropShadowToString(appBG.windmillShadow) + ")"
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
	animation: appBG.windmillMove ? "rot " + appBG.windmillSpeed + "s linear infinite" : "",
});
