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
	overflow: "hidden",
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

export const PRoomCardHeaderStyle: SxProps<Theme> = {
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
	flexShrink: 0,
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
	display: "grid",
	gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
	columnGap: 0.75,
	rowGap: 0.75,
	width: "100%",
	minWidth: 0,
	pt: 0.5,
	pb: 0.5,
	overflow: "hidden",
};

export const PRoomCardGenreStyle = (selected: boolean): SxProps<Theme> => ({
	width: "100%",
	minWidth: 0,
	px: 0.75,
	py: 0.25,
	boxSizing: "border-box",
	borderRadius: "999px",
	border: `2px solid ${selected ? appColors.tertiary[1] : appColors.greys[6]}`,
	backgroundColor: selected ? appColors.tertiary[0] : appColors.greys[7],
	color: selected ? appColors.text.light : appColors.greys[2],
	boxShadow: `0 3px 0 ${selected ? appColors.tertiary[4] : appColors.greys[9]}`,
	maxWidth: "100%",
	textAlign: "center",
});

export const PRoomCardGenreTextStyle: SxProps<Theme> = {
	m: 0.5,
	fontWeight: 800,
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
};
