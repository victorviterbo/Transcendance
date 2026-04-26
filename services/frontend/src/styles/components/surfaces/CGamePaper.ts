import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const CGamePaperStyle: SxProps<Theme> = (_theme) => ({
	borderRadius: appSharedStyle.gameRadius,
	height: "100%",
	p: 0,
});

export const CGamePaperTitleBoxStyle: SxProps<Theme> = (theme) => ({
	backgroundColor: theme.palette.primary.main,

	borderTopLeftRadius: appSharedStyle.gameRadius,
	borderTopRightRadius: appSharedStyle.gameRadius,

	p: "0px",
});

export const CGamePaperTitleStyle: SxProps<Theme> = (_) => ({
	color: appColors.text.dark,
	mx: 0,
});
