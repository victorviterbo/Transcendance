import { Grid, Stack } from "@mui/material";
import CText from "../../components/text/CText";

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

	return (
		<Stack spacing={2}>
			{title ? <CText size="md">{title}</CText> : null}
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, sm: 4 }}>
					<CText>Games played: {effectiveStats.gamesPlayed}</CText>
				</Grid>
				<Grid size={{ xs: 12, sm: 4 }}>
					<CText>Wins: {effectiveStats.wins}</CText>
				</Grid>
				<Grid size={{ xs: 12, sm: 4 }}>
					<CText>Losses: {effectiveStats.losses}</CText>
				</Grid>
				{effectiveStats.draws !== undefined ? (
					<Grid size={{ xs: 12, sm: 4 }}>
						<CText>Draws: {effectiveStats.draws}</CText>
					</Grid>
				) : null}
				<Grid size={{ xs: 12, sm: 4 }}>
					<CText>Win rate: {effectiveStats.winRate}%</CText>
				</Grid>
				<Grid size={{ xs: 12, sm: 4 }}>
					<CText>Current rank: {effectiveStats.rank}</CText>
				</Grid>
			</Grid>
		</Stack>
	);
}

export default ProfileStatisticsPanel;
