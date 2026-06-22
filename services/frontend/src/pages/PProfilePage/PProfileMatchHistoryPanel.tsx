import { Stack } from "@mui/material";
import { useEffect, useMemo, type ReactNode, useState } from "react";
import { fetchHistory } from "../../api/stats";
import CText from "../../components/text/CText";
import type { IHistoryEntry } from "../../types/stats";
import { getErrorMessage } from "../../utils/error";
import PProfileMatchHistoryAccordionCard from "./PProfileMatchHistoryAccordionCard";
import {
	PProfileLayoutStyle,
	type IProfileLayoutStyle,
} from "../../styles/pages/profile/PProfileLayoutStyle";
import {
	PProfileTextStyle,
	type IProfileTextStyle,
} from "../../styles/pages/profile/PProfileTextStyle";

type ProfileMatchHistoryStatus = "idle" | "loading" | "ready" | "error";

interface ProfileMatchHistoryPanelProps {
	title?: string;
	emptyMessage?: string;
}

function ProfileMatchHistoryPanel({
	title,
	emptyMessage = "HISTORY_EMPTY",
}: ProfileMatchHistoryPanelProps) {
	const [status, setStatus] = useState<ProfileMatchHistoryStatus>("loading");
	const [history, setHistory] = useState<IHistoryEntry[]>([]);
	const [error, setError] = useState<string | null>(null);
	const style: IProfileTextStyle = useMemo(() => {
		return PProfileTextStyle();
	}, []);
	const layoutStyle: IProfileLayoutStyle = useMemo(() => {
		return PProfileLayoutStyle();
	}, []);

	useEffect(() => {
		let ignore = false;

		void fetchHistory()
			.then((response) => {
				if (ignore) return;
				setHistory(response.history);
				setError(null);
				setStatus("ready");
			})
			.catch((historyError) => {
				if (ignore) return;
				setHistory([]);
				setError(getErrorMessage(historyError, "HISTORY_LOADING_FAILED"));
				setStatus("error");
			});

		return () => {
			ignore = true;
		};
	}, []);

	const historyCards = useMemo((): ReactNode[] => {
		return history.map((entry) => (
			<PProfileMatchHistoryAccordionCard
				key={`${entry.playedAt}-${entry.roomTitle}`}
				entry={entry}
			/>
		));
	}, [history]);

	return (
		<Stack spacing={2} sx={layoutStyle.tabContent}>
			{title ? <CText size="md">{title}</CText> : null}

			{status === "loading" ? ( //TODO Loading component?
				<CText size="sm">HISTORY_LOADING</CText>
			) : null}

			{status === "error" ? (
				<CText size="sm" sx={style.error}>
					{error ?? "HISTORY_LOADING_FAILED"}
				</CText>
			) : null}

			{status === "ready" && history.length === 0 ? <CText>{emptyMessage}</CText> : null}

			{status === "ready" && history.length > 0 ? (
				<Stack spacing={1.5}>{historyCards}</Stack>
			) : null}
		</Stack>
	);
}

export default ProfileMatchHistoryPanel;
