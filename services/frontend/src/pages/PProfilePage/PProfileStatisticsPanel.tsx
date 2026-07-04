import { Divider, Grid, Stack } from "@mui/material";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import StarIcon from "@mui/icons-material/Star";
import TimerIcon from "@mui/icons-material/Timer";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MicIcon from "@mui/icons-material/Mic";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { fetchGlobalStats } from "../../api/stats";
import { MUSIC_TAGS } from "../../constants";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import { ttrn } from "../../localization/localization";
import type { IGlobalStatsResponse } from "../../types/stats";
import { getErrorMessage } from "../../utils/error";
import { formatPercentage, formatSeconds } from "../../utils/string";
import PProfileStatisticsMetricCard from "./PProfileStatisticsMetricCard";
import {
	PProfileStatisticsStyle,
	type IProfileStatisticsStyle,
} from "../../styles/pages/profile/PProfileStatisticsStyle";
import {
	PProfileTextStyle,
	type IProfileTextStyle,
} from "../../styles/pages/profile/PProfileTextStyle";

type ProfileStatisticsStatus = "idle" | "loading" | "ready" | "error";

interface ProfileStatisticsState {
	status: ProfileStatisticsStatus;
	stats: IGlobalStatsResponse | null;
	error: string | null;
	username: string;
}

interface ProfileStatisticsPanelProps {
	title?: string;
	username: string;
}

interface StatisticMetricDefinition {
	icon: ReactNode;
	label: string;
	value: string;
}

const getStatisticMetrics = (stats: IGlobalStatsResponse): StatisticMetricDefinition[] => [
	{
		icon: <SportsEsportsIcon fontSize="large" />,
		label: "STATS_GAMES_PLAYED",
		value: ttrn(stats.totalGamesPlayed),
	},
	{
		icon: <QueueMusicIcon fontSize="large" />,
		label: "STATS_SONGS_PLAYED",
		value: ttrn(stats.totalSongsPlayed),
	},
	{
		icon: <EmojiEventsIcon fontSize="large" />,
		label: "STATS_GAMES_WON",
		value: ttrn(stats.totalGamesWon),
	},
	{
		icon: <StarIcon fontSize="large" />,
		label: "STATS_AVERAGE_SCORE",
		value: ttrn(stats.averageScore),
	},
	{
		icon: <TimerIcon fontSize="large" />,
		label: "STATS_AVERAGE_TIME",
		value: stats.averageTime >= 0 ? formatSeconds(stats.averageTime) : "N/A",
	},
	{
		icon: <LeaderboardIcon fontSize="large" />,
		label: "STATS_RANKING",
		value: `${ttrn(stats.ranking)} / ${ttrn(stats.totalPlayers)}`,
	},
	{
		icon: <MicIcon fontSize="large" />,
		label: "STATS_ARTIST_RATE",
		value: formatPercentage(stats.successRateArtist),
	},
	{
		icon: <AudiotrackIcon fontSize="large" />,
		label: "STATS_SONG_RATE",
		value: formatPercentage(stats.successRateSong),
	},
	{
		icon: <LibraryMusicIcon fontSize="large" />,
		label: "STATS_COMPLETE_RATE",
		value: formatPercentage(stats.successRateComplete),
	},
];

function ProfileStatisticsPanel({ title, username }: ProfileStatisticsPanelProps) {
	const [statisticsState, setStatisticsState] = useState<ProfileStatisticsState>({
		status: "idle",
		stats: null,
		error: null,
		username: "",
	});
	const style: IProfileStatisticsStyle = useMemo(() => {
		return PProfileStatisticsStyle();
	}, []);
	const textStyle: IProfileTextStyle = useMemo(() => {
		return PProfileTextStyle();
	}, []);
	const viewState = useMemo(() => {
		const isCurrentUsername = statisticsState.username === username;
		const status: ProfileStatisticsStatus = !username
			? "idle"
			: isCurrentUsername
				? statisticsState.status
				: "loading";
		const stats = isCurrentUsername ? statisticsState.stats : null;
		const error = isCurrentUsername ? statisticsState.error : null;

		return { error, stats, status };
	}, [statisticsState, username]);

	useEffect(() => {
		if (!username) return;

		let ignore = false;

		void fetchGlobalStats(username)
			.then((stats) => {
				if (ignore) return;
				setStatisticsState({
					status: "ready",
					stats,
					error: null,
					username,
				});
			})
			.catch((error) => {
				if (ignore) return;
				setStatisticsState({
					status: "error",
					stats: null,
					error: getErrorMessage(error, "PROFILE_STATS_LOAD_FAILED"),
					username,
				});
			});

		return () => {
			ignore = true;
		};
	}, [username]);

	const statisticMetrics = useMemo(() => {
		return viewState.stats ? getStatisticMetrics(viewState.stats) : [];
	}, [viewState.stats]);

	const tagRates = useMemo(() => {
		return MUSIC_TAGS.map((tag) => ({
			tag,
			value: viewState.stats?.successRatesCompleteByTag[tag] ?? 0,
		}));
	}, [viewState.stats]);

	return (
		<Stack spacing={3}>
			{title ? <CText size="md">{title}</CText> : null}

			{viewState.status === "loading" ? <CText size="sm">PROFILE_STATS_LOADING</CText> : null}

			{viewState.status === "error" ? (
				<CText size="sm" sx={textStyle.error}>
					{viewState.error ?? "PROFILE_STATS_LOAD_FAILED"}
				</CText>
			) : null}

			{viewState.status === "ready" && viewState.stats ? (
				<Stack spacing={3}>
					<Grid container spacing={2}>
						{statisticMetrics.map((metric) => (
							<Grid size={{ xs: 12, sm: 6, md: 4 }} key={metric.label}>
								<PProfileStatisticsMetricCard
									icon={metric.icon}
									label={metric.label}
									value={metric.value}
								/>
							</Grid>
						))}
					</Grid>

					<Divider flexItem sx={style.divider} />

					<Stack spacing={1.5}>
						<CTitle size="sm" sx={{ mb: 0 }}>
							STATS_COMPLETE_RATES_BY_TAG
						</CTitle>
						<Grid container spacing={1.5}>
							{tagRates.map(({ tag, value }) => (
								<Grid size={{ xs: 12, sm: 6, md: 4 }} key={tag}>
									<PProfileStatisticsMetricCard
										label={tag}
										value={formatPercentage(value)}
										variant="inline"
										tone="secondary"
									/>
								</Grid>
							))}
						</Grid>
					</Stack>
				</Stack>
			) : null}
		</Stack>
	);
}

export default ProfileStatisticsPanel;
