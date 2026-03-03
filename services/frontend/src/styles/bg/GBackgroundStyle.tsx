import type { SxProps, Theme } from "@mui/material";
import { appThemeDef } from "../theme";

export const SBGBox: SxProps<Theme> = {
	position: "fix",

	height: "100%",
	width: "100%",
	zIndex: appThemeDef.bg.baseIndex,
}

export const SBGBaseColor:  SxProps<Theme> = (Theme) => ({
	position: "absolute",

	height: "100%",
	width: "100%",
	zIndex: appThemeDef.bg.baseIndex,

	backgroundColor: Theme.palette.primary.main,
})

