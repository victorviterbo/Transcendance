import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import type { CTitleBasePaperProps } from "../../../components/surfaces/CTitleBasePaper";

export const CTitlePaperStyle = ({borderRadius}: CTitleBasePaperProps) => ({
	borderRadius: borderRadius == undefined ? appSharedStyle.paperRadius : borderRadius,
	p: 0,
});

export const CTitlePaperTitleBoxStyle = ({borderRadius, titlePadding}: CTitleBasePaperProps) => ({
	backgroundColor: appColors.primary[0],
	
	borderTopLeftRadius: borderRadius == undefined ? appSharedStyle.paperRadius : borderRadius,
	borderTopRightRadius: borderRadius == undefined ? appSharedStyle.paperRadius : borderRadius,

	p: titlePadding == undefined ? 1 : titlePadding,
});

export const CTitlePaperTitleStyle: SxProps<Theme> = (_theme) => ({
	color: appColors.text.dark,
});

export const CTitlePaperContentBox: SxProps<Theme> = (_theme) => ({
	p: 4,
});


export const CGamePaperTitleStyle: SxProps<Theme> = (_) => ({
	color: appColors.text.dark,
	mx: 0,
});