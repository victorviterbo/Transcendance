import type { SxProps, Theme } from "@mui/material";
import { colorAlterColor, colorGetBackground } from "../../../utils/styles";
import { appColors, appSharedStyle } from "../../theme";

export interface IProfileStatisticsStyle {
	metricCard: (isInline: boolean, tone: "primary" | "secondary") => SxProps<Theme>;
	metricIcon: SxProps<Theme>;
	metricLabel: SxProps<Theme>;
	divider: SxProps<Theme>;
}

export const PProfileStatisticsStyle = (): IProfileStatisticsStyle => ({
	metricCard: (isInline: boolean, tone: "primary" | "secondary"): SxProps<Theme> => ({
		height: "100%",
		p: isInline ? 1.5 : 2,
		borderRadius: isInline ? appSharedStyle.smallGameRadius : appSharedStyle.gameRadius,
		background:
			tone === "secondary"
				? colorGetBackground(
						[
							appColors.secondary[0],
							colorAlterColor(appColors.secondary[0], "shift-hue", -30),
						],
						undefined,
						"linear",
						160,
					)
				: colorGetBackground(
						[appColors.primary[0], appColors.quinary[0]],
						undefined,
						"linear",
						160,
					),
		border: `2px solid ${tone === "secondary" ? appColors.secondary[0] : appColors.primary[0]}`,
		boxShadow: `0px 3px 0px 0px ${appColors.greys[9]}`,
	}),
	metricIcon: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 52,
		height: 52,
		borderRadius: appSharedStyle.smallGameRadius,
		backgroundColor: appColors.secondary[0],
		color: appColors.text.dark,
		boxShadow: `0px 3px 0px 0px ${appColors.secondary[4]}`,
	},
	metricLabel: {
		mb: 0,
		color: appColors.greys[1],
		textTransform: "uppercase",
		letterSpacing: "0.08em",
	},
	divider: {
		borderColor: appColors.primary[2],
	},
});
