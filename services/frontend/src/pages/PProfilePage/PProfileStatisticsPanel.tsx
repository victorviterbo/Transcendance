import { Box, Grid, Stack } from "@mui/material";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import { appColors } from "../../styles/theme";

export interface ProfileStatisticsData {
	gamesPlayed: number;
	wins: number;
	losses: number;
	winRate: number;
	rank: string;
	draws?: number;
}

const DEFAULT_PUBLIC_STATS: ProfileStatisticsData = {
	gamesPlayed: 18,
	wins: 10,
	losses: 7,
	winRate: 56,
	rank: "Silver",
};

const DEFAULT_ME_STATS: ProfileStatisticsData = {
	gamesPlayed: 24,
	wins: 14,
	losses: 9,
	draws: 1,
	winRate: 58,
	rank: "Diamond",
};

export type ProfileStatisticsScope = "me" | "public";

export function getDefaultStatistics(scope: ProfileStatisticsScope): ProfileStatisticsData {
	return scope === "public" ? { ...DEFAULT_PUBLIC_STATS } : { ...DEFAULT_ME_STATS };
}

interface ProfileStatisticsPanelProps {
	stats?: ProfileStatisticsData;
	scope?: ProfileStatisticsScope;
	title?: string;
}

function ProfileStatisticsPanel({ stats, scope = "me", title }: ProfileStatisticsPanelProps) {
	const effectiveStats = stats ?? getDefaultStatistics(scope);
	const statItems = [
		{ label: "Games played", value: effectiveStats.gamesPlayed, accent: appColors.primary[0] },
		{ label: "Wins", value: effectiveStats.wins, accent: appColors.secondary[0] },
		{ label: "Losses", value: effectiveStats.losses, accent: appColors.tertiary[0] },
		...(effectiveStats.draws !== undefined
			? [{ label: "Draws", value: effectiveStats.draws, accent: appColors.quinary[0] }]
			: []),
		{ label: "Win rate", value: `${effectiveStats.winRate}%`, accent: appColors.primary[1] },
		{ label: "Current rank", value: effectiveStats.rank, accent: appColors.secondary[1] },
	];

	return (
		<Stack spacing={2}>
			{title ? <CText size="md">{title}</CText> : null}
			<Grid container spacing={2}>
				{statItems.map((item) => (
					<Grid size={{ xs: 12, sm: 6, lg: 4 }} key={item.label}>
						<Box
							sx={{
								height: "100%",
								p: 2.25,
								borderRadius: "24px",
								backgroundColor: "rgba(23, 15, 56, 0.18)",
								border: "2px solid rgba(255, 255, 255, 0.18)",
								boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
							}}
						>
							<Stack spacing={1.1}>
								<Box
									sx={{
										width: 42,
										height: 8,
										borderRadius: "999px",
										backgroundColor: item.accent,
									}}
								></Box>
								<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.76)" }}>
									{item.label}
								</CText>
								<CTitle
									size="sm"
									sx={{ color: "common.white", fontSize: "1.55rem" }}
								>
									{item.value}
								</CTitle>
							</Stack>
						</Box>
					</Grid>
				))}
			</Grid>
		</Stack>
	);
}

export default ProfileStatisticsPanel;
