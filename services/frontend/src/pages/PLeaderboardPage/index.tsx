import { alpha, Container, Divider, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../../api/stats";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import { getErrorMessage } from "../../utils/error";
import type { ILeaderboardResponse } from "../../types/stats";
import GPageBase from "../common/GPageBases";
import { appPositions } from "../../styles/theme";
import PLeaderboardRow from "./PLeaderboardRow";
import { ttrf } from "../../localization/localization";

type LeaderboardStatus = "loading" | "ready" | "error";

interface LeaderboardState {
	status: LeaderboardStatus;
	data: ILeaderboardResponse | null;
	error: string | null;
}

function PLeaderboardPage() {
	const spacing = appPositions.mainSpacing;
	const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>({
		status: "loading",
		data: null,
		error: null,
	});

	useEffect(() => {
		let ignore = false;

		void fetchLeaderboard()
			.then((data) => {
				if (ignore) return;
				setLeaderboardState({
					status: "ready",
					data,
					error: null,
				});
			})
			.catch((error) => {
				if (ignore) return;
				setLeaderboardState({
					status: "error",
					data: null,
					error: getErrorMessage(error, "LEADERBOARD_LOAD_FAILED"),
				});
			});

		return () => {
			ignore = true;
		};
	}, []);

	return (
		<GPageBase>
			<Container maxWidth="md" sx={{ py: spacing }}>
				<CTitlePaper title="Leaderboard" titleType="title" titleSize="md">
					{leaderboardState.status === "loading" ? (
						<CTitle size="sm">LEADERBOARD_LOADING</CTitle>
					) : null}

					{leaderboardState.status === "error" ? (
						<Stack spacing={1}>
							<CTitle size="sm" sx={{ color: "error.main" }}>
								Unable to load leaderboard
							</CTitle>
							<CText size="md">
								{leaderboardState.error ?? "LEADERBOARD_LOADING_FAILED"}
							</CText>
						</Stack>
					) : null}

					{leaderboardState.status === "ready" && leaderboardState.data ? (
						<Stack spacing={3}>
							<CText align="center">LEADERBOARD_MESSAGE</CText>
							<Stack
								divider={
									<Divider
										flexItem
										sx={(theme) => ({
											borderColor: alpha(theme.palette.primary.main, 0.1),
										})}
									/>
								}
								sx={{ px: { xs: 1, md: 0.5 } }}
							>
								{leaderboardState.data.leaderboard.map((entry) => (
									<PLeaderboardRow
										key={`${entry.ranking}-${entry.username}`}
										entry={entry}
									/>
								))}
							</Stack>
							<Divider
								flexItem
								sx={(theme) => ({
									borderColor: alpha(theme.palette.primary.main, 0.1),
								})}
							/>
							<Typography
								align="center"
								sx={(theme) => ({
									mb: 0,
									color: alpha(theme.palette.text.primary, 0.72),
								})}
							>
								{ttrf("LEADERBOARD_TOTAL_PLAYERS", {
									number: String(leaderboardState.data.totalNumberPlayer),
								})}
							</Typography>
						</Stack>
					) : null}
				</CTitlePaper>
			</Container>
		</GPageBase>
	);
}

export default PLeaderboardPage;
