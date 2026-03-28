import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";
import { colorGetBackground } from "../../../utils/styles";

export const CAccordionStyle: SxProps<Theme> = (_) => ({
	overflow: "hidden",
});

export const CAccordionSummaryStyle: SxProps<Theme> = (_) => ({
	background: colorGetBackground(
		[appColors.primary[0], appColors.quaternary[0]],
		undefined,
		"linear",
		160 + 180,
	),
});

export const CAccordionDetailsStyle: SxProps<Theme> = (_) => ({
	background: colorGetBackground(
		[appColors.primary[2], appColors.tertiary[0], appColors.secondary[0]],
		undefined,
		"linear",
		160,
	),
});
