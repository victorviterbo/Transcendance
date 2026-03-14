import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export const CTitlePaperStyle: SxProps<Theme> = (_theme) => ({
	p: 0,
});

export const CTitlePaperTitleBoxStyle: SxProps<Theme> = (theme) => ({
	backgroundColor: theme.palette.primary.main,

	borderTopLeftRadius: theme.shape.borderRadius,
	borderTopRightRadius: theme.shape.borderRadius,

	p: 1,
});

export const CTitlePaperTitleStyle: SxProps<Theme> = (_theme) => ({
	color: appColors.text.dark,
});

export const CTitlePaperContentBox: SxProps<Theme> = (_theme) => ({
	p: 4,
});
