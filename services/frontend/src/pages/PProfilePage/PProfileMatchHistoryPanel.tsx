import { Box, Stack } from "@mui/material";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";

export interface MatchHistoryItem {
	date: string;
	opponent: string;
	score: string;
	result: string;
}

const DEFAULT_PUBLIC_MATCH_HISTORY: MatchHistoryItem[] = [
	{ date: "2026-02-19", opponent: "NovaKing", score: "9 - 7", result: "WIN" },
	{ date: "2026-02-17", opponent: "AcePilot", score: "5 - 9", result: "LOSS" },
];

const DEFAULT_ME_MATCH_HISTORY: MatchHistoryItem[] = [
	{ date: "2026-02-20", opponent: "AcePilot", score: "10 - 7", result: "WIN" },
	{ date: "2026-02-18", opponent: "CyberNova", score: "6 - 12", result: "LOSS" },
	{ date: "2026-02-16", opponent: "NovaKing", score: "8 - 8", result: "DRAW" },
];

export type MatchHistoryScope = "me" | "public";

export function getDefaultMatchHistory(scope: MatchHistoryScope): MatchHistoryItem[] {
	return scope === "public" ? [...DEFAULT_PUBLIC_MATCH_HISTORY] : [...DEFAULT_ME_MATCH_HISTORY];
}

interface ProfileMatchHistoryPanelProps {
	history?: MatchHistoryItem[];
	scope?: MatchHistoryScope;
	emptyMessage?: string;
}

function ProfileMatchHistoryPanel({
	history,
	scope = "me",
	emptyMessage = "No matches to show yet.",
}: ProfileMatchHistoryPanelProps) {
	const effectiveHistory = history ?? getDefaultMatchHistory(scope);
	if (effectiveHistory.length === 0) {
		return <CText>{emptyMessage}</CText>;
	}

	const getResultStyle = (result: string) => {
		if (result === "WIN") {
			return {
				backgroundColor: "rgba(255, 216, 74, 0.94)",
				color: "rgba(23, 15, 56, 0.94)",
			};
		}
		if (result === "DRAW") {
			return {
				backgroundColor: "rgba(66, 237, 255, 0.9)",
				color: "rgba(23, 15, 56, 0.94)",
			};
		}
		return {
			backgroundColor: "rgba(255, 88, 188, 0.92)",
			color: "rgba(255, 255, 255, 0.94)",
		};
	};

	return (
		<Stack spacing={1.5}>
			{effectiveHistory.map((match) => (
				<Box
					key={`${match.date}-${match.opponent}-${match.result}`}
					sx={{
						p: 2.25,
						borderRadius: "24px",
						backgroundColor: "rgba(23, 15, 56, 0.18)",
						border: "2px solid rgba(255, 255, 255, 0.18)",
					}}
				>
					<Stack
						direction={{ xs: "column", md: "row" }}
						spacing={2}
						alignItems={{ xs: "flex-start", md: "center" }}
						justifyContent="space-between"
					>
						<Stack spacing={0.7}>
							<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.72)" }}>
								{match.date}
							</CText>
							<CTitle size="sm" sx={{ color: "common.white" }}>
								{match.opponent}
							</CTitle>
						</Stack>
						<Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
							<Box
								sx={{
									px: 1.5,
									py: 0.75,
									borderRadius: "999px",
									backgroundColor: "rgba(255, 255, 255, 0.12)",
									border: "2px solid rgba(255, 255, 255, 0.2)",
								}}
							>
								<CText size="sm">Score: {match.score}</CText>
							</Box>
							<Box
								sx={{
									px: 1.5,
									py: 0.75,
									borderRadius: "999px",
									fontFamily: "DynaPuff, sans-serif",
									fontSize: "0.82rem",
									fontWeight: 700,
									letterSpacing: "0.04em",
									...getResultStyle(match.result),
								}}
							>
								{match.result}
							</Box>
						</Stack>
					</Stack>
				</Box>
			))}
		</Stack>
	);
}

export default ProfileMatchHistoryPanel;
