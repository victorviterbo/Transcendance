import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export const CHomePaperStyle: SxProps<Theme> = (_theme) => ({
	p: 0,
});

export const CHomePaperTitleBoxStyle: SxProps<Theme> = (theme) => ({
	backgroundColor: theme.palette.primary.main,

	borderTopLeftRadius: theme.shape.borderRadius,
	borderTopRightRadius: theme.shape.borderRadius,

	p: 1,
});

export const CHomePaperTitleStyle: SxProps<Theme> = (_theme) => ({
	color: appColors.text.dark,
});

export const CHomePaperContentBox: SxProps<Theme> = (_theme) => ({
	p: 4,
});
