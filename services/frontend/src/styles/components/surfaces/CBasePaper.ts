import type { SxProps, Theme } from "@mui/material";
import { appSharedStyle } from "../../theme";

const CBasePaperStyle: SxProps<Theme> = (_theme) => ({
	position: "relative",
	isolation: "isolate",
	overflow: "hidden",
	background: appSharedStyle.bg.paper,
	border: "4px solid rgba(255, 255, 255, 0.82)",
	boxShadow:
		"0 12px 0 rgba(23, 15, 56, 0.28), 0 28px 42px rgba(23, 15, 56, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.24)",
	backdropFilter: "blur(16px)",
	p: {
		xs: 2.5,
		md: 3.5,
	},
	"&::before": {
		content: '""',
		position: "absolute",
		inset: 0,
		background:
			"linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 26%, rgba(255, 255, 255, 0.02) 100%)",
		pointerEvents: "none",
	},
	"&::after": {
		content: '""',
		position: "absolute",
		inset: 6,
		borderRadius: "22px",
		border: "1px solid rgba(255, 255, 255, 0.16)",
		pointerEvents: "none",
	},
	"& > *": {
		position: "relative",
		zIndex: 1,
	},
});

export default CBasePaperStyle;
