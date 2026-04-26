import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const CGamePaperStyle: SxProps<Theme> = (_) => ({
	borderRadius: appSharedStyle.gameRadius,
	height: "100%",
	p: 0,
});

export const CGamePaperTitleBoxStyle: SxProps<Theme> = (_) => ({
	backgroundColor: appColors.primary[0],

	borderTopLeftRadius: appSharedStyle.gameRadius,
	borderTopRightRadius: appSharedStyle.gameRadius,

	p: "0px",
});

export const CGamePaperTitleStyle: SxProps<Theme> = (_) => ({
	color: appColors.text.dark,
	mx: 0,
});
