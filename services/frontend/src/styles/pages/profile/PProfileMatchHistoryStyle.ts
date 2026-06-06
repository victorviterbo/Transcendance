import type { SxProps, Theme } from "@mui/material";
import { colorGetBackground } from "../../../utils/styles";
import { appColors, appSharedStyle } from "../../theme";

export interface IProfileMatchHistoryStyle {
	card: SxProps<Theme>;
	summary: SxProps<Theme>;
	summaryContent: SxProps<Theme>;
	summaryHeader: SxProps<Theme>;
	summaryTitleGroup: SxProps<Theme>;
	summaryTitle: SxProps<Theme>;
	summaryMeta: SxProps<Theme>;
	divider: SxProps<Theme>;
	roundEntry: SxProps<Theme>;
	roundMetaIcon: SxProps<Theme>;
	roundStatusIcon: (statusColor: string) => SxProps<Theme>;
	roundStatusColor: (found: boolean) => string;
}

export const PProfileMatchHistoryStyle = (): IProfileMatchHistoryStyle => ({
	card: {
		borderRadius: appSharedStyle.gameRadius,
		background: colorGetBackground(
			[appColors.greys[8], appColors.greys[7]],
			undefined,
			"linear",
			160,
		),
		border: `2px solid ${appColors.primary[2]}`,
		boxShadow: `0px 3px 0px 0px ${appColors.greys[9]}`,
		"&:before": {
			display: "none",
		},
	},
	summary: {
		px: 2,
		py: 1,
	},
	summaryContent: {
		width: "100%",
	},
	summaryHeader: {
		display: "grid",
		gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
		alignItems: { xs: "flex-start", sm: "center" },
		columnGap: 3,
		rowGap: 1,
		minWidth: 0,
	},
	summaryTitleGroup: {
		minWidth: 0,
	},
	summaryTitle: {
		mb: 0,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	summaryMeta: {
		justifySelf: { xs: "start", sm: "end" },
		flexShrink: 0,
	},
	divider: {
		borderColor: appColors.primary[2],
	},
	roundEntry: {
		width: "100%",
		py: 1,
		px: 0.75,
		borderRadius: 0,
		background: "transparent",
	},
	roundMetaIcon: {
		display: "flex",
		alignItems: "center",
		color: appColors.greys[1],
	},
	roundStatusIcon: (statusColor: string): SxProps<Theme> => ({
		fontSize: 12,
		color: statusColor,
	}),
	roundStatusColor: (found: boolean) => {
		return found ? appColors.validate[0] : appColors.cancel[0];
	},
});
