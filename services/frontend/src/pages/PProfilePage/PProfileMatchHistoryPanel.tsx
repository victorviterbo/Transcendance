import { Box, Divider, List, ListItem, ListItemText } from "@mui/material";
import CText from "../../components/text/CText";
import { Fragment } from "react";

export interface MatchHistoryItem {
	date: string;
	opponent: string;
	score: string;
	result: string;
}

const DEFAULT_ME_MATCH_HISTORY: MatchHistoryItem[] = [
	{ date: "2026-02-20", opponent: "AcePilot", score: "10 - 7", result: "WIN" },
	{ date: "2026-02-18", opponent: "CyberNova", score: "6 - 12", result: "LOSS" },
	{ date: "2026-02-16", opponent: "NovaKing", score: "8 - 8", result: "DRAW" },
];

interface ProfileMatchHistoryPanelProps {
	history?: MatchHistoryItem[];
	emptyMessage?: string;
}

function ProfileMatchHistoryPanel({
	history,
	emptyMessage = "No matches to show yet.",
}: ProfileMatchHistoryPanelProps) {
	const effectiveHistory = history ?? [...DEFAULT_ME_MATCH_HISTORY];
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
