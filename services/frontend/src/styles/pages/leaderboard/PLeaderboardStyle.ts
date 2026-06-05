import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import { colorAlterColor, colorGetBackground, getScaledRadius } from "../../../utils/styles";

export interface ILeaderboardStyle {
	errorText: SxProps<Theme>;
	rows: SxProps<Theme>;
	footerText: SxProps<Theme>;
	row: (isCurrentUser: boolean, isTopThree: boolean) => SxProps<Theme>;
	ranking: (isTopThree: boolean) => SxProps<Theme>;
	rankingText: SxProps<Theme>;
	avatar: (isCurrentUser: boolean, isTopThree: boolean) => SxProps<Theme>;
	badge: (isCurrentUser: boolean, isTopThree: boolean) => SxProps<Theme>;
	badgeText: SxProps<Theme>;
	pointsLabel: (isCurrentUser: boolean, isTopThree: boolean) => SxProps<Theme>;
	pointsValue: (isCurrentUser: boolean, isTopThree: boolean) => SxProps<Theme>;
	pointsText: SxProps<Theme>;
}

const getRowBackground = (isCurrentUser: boolean, isTopThree: boolean) => {
	if (isCurrentUser) {
		return colorGetBackground(
			[appColors.primary[0], appColors.quinary[0]],
			undefined,
			"linear",
			160,
		);
	}
	if (isTopThree) {
		return colorGetBackground(
			[
				appColors.secondary[0],
				colorAlterColor(
					appColors.secondary[0],
					["shift-hue", "shift-brightness"],
					[-30, -0.12],
				),
			],
			undefined,
			"linear",
			160,
		);
	}
	return colorGetBackground([appColors.greys[8], appColors.greys[7]], undefined, "linear", 160);
};

export const PLeaderboardStyle = (): ILeaderboardStyle => ({
	errorText: {
		color: appColors.cancel[0],
	},
	rows: {
		px: { xs: 1, md: 0.5 },
	},
	footerText: {
		mb: 0,
		color: appColors.greys[1],
	},
	row: (isCurrentUser: boolean, isTopThree: boolean): SxProps<Theme> => ({
		px: { xs: 1.5, md: 2 },
		py: { xs: 1.5, md: 1.75 },
		borderRadius: getScaledRadius(appSharedStyle.radius, 2),
		background: getRowBackground(isCurrentUser, isTopThree),
		border: isCurrentUser || isTopThree ? undefined : `2px solid ${appColors.greys[7]}`,
		boxShadow: `0px 3px 0px 0px ${appColors.greys[9]}`,
	}),
	ranking: (isTopThree: boolean): SxProps<Theme> => ({
		minWidth: { xs: 44, sm: 52 },
		height: { xs: 44, sm: 52 },
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: getScaledRadius(appSharedStyle.radius, 2),
		background: isTopThree
			? colorGetBackground(
					[appColors.secondary[1], appColors.secondary[3]],
					undefined,
					"linear",
					180,
				)
			: appColors.greys[9],
		border: `2px solid ${isTopThree ? appColors.secondary[0] : appColors.greys[6]}`,
		boxShadow: `0px 3px 0px 0px ${isTopThree ? appColors.secondary[4] : appColors.greys[9]}`,
	}),
	rankingText: {
		mb: 0,
		color: appColors.text.light,
		fontVariantNumeric: "tabular-nums",
	},
	avatar: (isCurrentUser: boolean, isTopThree: boolean): SxProps<Theme> => ({
		width: { xs: 48, sm: 56 },
		height: { xs: 48, sm: 56 },
		bgcolor: isCurrentUser
			? appColors.quinary[0]
			: isTopThree
				? appColors.secondary[0]
				: appColors.primary[5],
		fontWeight: 700,
		border: `2px solid ${
			isCurrentUser
				? appColors.text.light
				: isTopThree
					? appColors.secondary[1]
					: appColors.primary[4]
		}`,
	}),
	badge: (isCurrentUser: boolean, isTopThree: boolean): SxProps<Theme> => ({
		alignSelf: "flex-start",
		mt: 0.6,
		px: 1.25,
		py: 0.6,
		borderRadius: getScaledRadius(appSharedStyle.radius, 2.25),
		backgroundColor: appColors.greys[9],
		border: `1px solid ${
			isCurrentUser
				? appColors.primary[1]
				: isTopThree
					? appColors.secondary[2]
					: appColors.greys[7]
		}`,
	}),
	badgeText: {
		color: appColors.text.light,
		mb: 0,
	},
	pointsLabel: (isCurrentUser: boolean, isTopThree: boolean): SxProps<Theme> => ({
		mb: 0,
		color: isCurrentUser || isTopThree ? appColors.text.light : appColors.greys[1],
		letterSpacing: "0.08em",
		textTransform: "uppercase",
	}),
	pointsValue: (isCurrentUser: boolean, isTopThree: boolean): SxProps<Theme> => ({
		minWidth: { xs: 74, sm: 88 },
		px: 1.25,
		py: 0.75,
		borderRadius: getScaledRadius(appSharedStyle.radius, 2),
		backgroundColor: appColors.greys[9],
		border: `2px solid ${
			isCurrentUser
				? appColors.quinary[0]
				: isTopThree
					? appColors.secondary[1]
					: appColors.primary[4]
		}`,
		boxShadow: `0px 3px 0px 0px ${appColors.greys[9]}`,
	}),
	pointsText: {
		mb: 0,
		fontVariantNumeric: "tabular-nums",
	},
});
