import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export const CTitlePaperContainerStyle: SxProps<Theme> = (_theme) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	alignItems: "stretch",
});

export const CTitlePaperTitleBoxStyle: SxProps<Theme> = (theme) => ({
	...(typeof theme.shape.borderRadius === "number"
		? {
				borderTopLeftRadius: `${theme.shape.borderRadius}px`,
				borderTopRightRadius: `${theme.shape.borderRadius}px`,
			}
		: {
				borderTopLeftRadius: theme.shape.borderRadius,
				borderTopRightRadius: theme.shape.borderRadius,
			}),
	position: "relative",
	width: "100%",
	background:
		"linear-gradient(135deg, rgba(255, 216, 74, 0.96) 0%, rgba(255, 88, 188, 0.96) 100%)",
	border: "4px solid rgba(255, 255, 255, 0.82)",
	borderBottomWidth: "3px",
	boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.24)",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	minHeight: {
		xs: 72,
		md: 80,
	},
	px: {
		xs: 2,
		md: 2.5,
	},
	py: {
		xs: 1.2,
		md: 1.35,
	},
	"&::after": {
		content: '""',
		position: "absolute",
		inset: "auto 18px 10px",
		height: "1px",
		background: "rgba(255, 255, 255, 0.34)",
		borderRadius: "999px",
		opacity: 0.8,
	},
});

export const CTitlePaperBodyStyle: SxProps<Theme> = (theme) => ({
	flex: 1,
	p: 0,
	mt: "-3px",
	borderTop: 0,
	borderTopLeftRadius: 0,
	borderTopRightRadius: 0,
	boxShadow:
		"0 12px 0 rgba(23, 15, 56, 0.28), 0 28px 42px rgba(23, 15, 56, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
	"&::after": {
		inset: 6,
		top: 0,
		borderTop: 0,
		borderTopLeftRadius: 0,
		borderTopRightRadius: 0,
	},
	...(typeof theme.shape.borderRadius === "number"
		? {
				borderBottomLeftRadius: `${theme.shape.borderRadius}px`,
				borderBottomRightRadius: `${theme.shape.borderRadius}px`,
			}
		: {
				borderBottomLeftRadius: theme.shape.borderRadius,
				borderBottomRightRadius: theme.shape.borderRadius,
			}),
});

export const CTitlePaperTitleStyle: SxProps<Theme> = (_theme) => ({
	color: appColors.text.dark,
	textShadow: "0 2px 0 rgba(255, 255, 255, 0.34)",
});

export const CTitlePaperContentBox: SxProps<Theme> = (_theme) => ({
	flex: 1,
	p: {
		xs: 2.25,
		md: 3,
	},
	display: "flex",
	flexDirection: "column",
	gap: 2.5,
});
