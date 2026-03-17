import { Box, Divider, List, ListItem, ListItemText } from "@mui/material";
import CText from "../../components/text/CText";
import { Fragment } from "react";

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

	return (
		<List>
			{effectiveHistory.map((match) => (
				<Fragment key={`${match.date}-${match.opponent}-${match.result}`}>
					<ListItem>
						<ListItemText
							primary={`${match.date} — ${match.opponent}`}
							secondary={`Score: ${match.score} • ${match.result}`}
						/>
					</ListItem>
					<Divider component={Box} />
				</Fragment>
			))}
		</List>
	);
}

export default ProfileMatchHistoryPanel;
