import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const PRoomCardButtonStyle: SxProps<Theme> = {
	width: "100%",
	minHeight: 100,
	justifyContent: "stretch",
	alignItems: "stretch",
	p: 1.75,
	textAlign: "left",
	borderRadius: appSharedStyle.gameRadius,
	border: `3px solid ${appColors.primary[1]}`,
	background: appSharedStyle.bg.feedback,
	"&:hover": {
		border: `3px solid ${appColors.secondary[2]}`,
		borderRadius: appSharedStyle.gameRadius,
		color: appColors.text.light,
	},
};

export const PRoomCardContentStyle: SxProps<Theme> = {
	width: "100%",
	minWidth: 0,
};

export const PRoomCardNameStyle: SxProps<Theme> = {
	flex: 1,
	minWidth: 0,
	m: 0,
	fontWeight: 900,
	textShadow: `1px 3px 0 ${appColors.tertiary[4]}`,
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
};

export const PRoomCardPlayerCountStyle: SxProps<Theme> = {
	px: 1,
	py: 0.35,
	borderRadius: "999px",
	border: `2px solid ${appColors.secondary[0]}`,
	backgroundColor: appColors.secondary[0],
	color: appColors.text.dark,
	boxShadow: `0 3px 0 ${appColors.secondary[4]}`,
};

export const PRoomCardPlayerIconStyle: SxProps<Theme> = {
	fontSize: 18,
};

export const PRoomCardPlayerTextStyle: SxProps<Theme> = {
	fontWeight: 900,
};

export const PRoomCardGenresStyle: SxProps<Theme> = {
	pt: 0.5,
	pb: 0.5,
	overflow: "hidden",
};

export const PRoomCardGenreStyle: SxProps<Theme> = {
	px: 0.75,
	py: 0.25,
	borderRadius: "999px",
	border: `2px solid ${appColors.tertiary[1]}`,
	backgroundColor: appColors.tertiary[0],
	color: appColors.text.light,
	boxShadow: `0 3px 0 ${appColors.tertiary[4]}`,
	maxWidth: "100%",
};

export const PRoomCardGenreTextStyle: SxProps<Theme> = {
	m: 0.5,
	fontWeight: 800,
};

export const PRoomCardEmptyGenreStyle: SxProps<Theme> = {
	fontWeight: 800,
	color: appColors.greys[1],
};
