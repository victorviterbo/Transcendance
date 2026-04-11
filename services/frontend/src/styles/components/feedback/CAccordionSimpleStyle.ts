import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
export const CAccordionSimpleStyle: SxProps<Theme> = (_) => ({
	boxShadow: "0px 0px 0px 0px black",
	borderRadius: 0,
	overflow: "visible",
});

export const CAccordionSimpleSummaryStyle: SxProps<Theme> = (_) => ({
	background: appColors.greys[5],
	borderRadius: appSharedStyle.radius + "px",

	minHeight: "32px",

	"&.Mui-expanded": {
		minHeight: "32px",
	},

	".MuiAccordionSummary-content": {
		my: "0px !important",
	},

	".MuiAccordionSummary-expandIconWrapper": {
		color: appColors.text.light,
	},
});

export const CAccordionSimpleDetailsStyle: SxProps<Theme> = (_) => ({
	background: "rgba(0,0,0,0)",
});
