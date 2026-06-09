import { useCallback, useEffect, useMemo, useState } from "react";
import CGamePaper from "../../../components/surfaces/CGamePaper";
import type {
	IGamePlayer,
	IGamePlayerResult,
	IGameRound,
	IGameSettings,
	IGameStatus,
} from "../../../types/game";
import PGameLobby from "./PGameLobby";
import PGameSettings from "./PGameSettings";
import PGameRound from "./PGameRound";
import type { GameInstance } from "../../../handlers/gameHandlers";

interface PGameViewsProps {
	game: React.RefObject<GameInstance | undefined>;
	status: IGameStatus;
	players: IGamePlayer[];
	settings: IGameSettings;
	rounds: IGameRound[];
	results: IGamePlayerResult[];
	volume: number;
	muted: boolean;
	answerRef: React.RefObject<HTMLDivElement | null>;
}

type ECurrentViewType = {
	LOBBY: number;
	SETTINGS: number;
	PLAYING: number;
};

const ECurrentView: ECurrentViewType = {
	LOBBY: 0,
	SETTINGS: 1,
	PLAYING: 2,
};

function PGameViews({
	game,
	status,
	rounds,
	players,
	results,
	settings,
	volume,
	muted,
	answerRef,
}: PGameViewsProps) {
	//====================== STATES ======================
	const getCurrentView = useCallback((): number => {
		if (status.phase == "playing_round" || status.phase == "playing_break")
			return ECurrentView.PLAYING;
		return ECurrentView.LOBBY;
	}, [status]);

	const [currentView, setCurrentView] = useState<number>(getCurrentView());

	useEffect(() => {
		async function changeView() {
			setCurrentView(getCurrentView());
		}
		changeView();
	}, [status.phase, setCurrentView, getCurrentView]);

	//====================== FUNCTIONS ======================
	const currentTitle: string = useMemo(() => {
		switch (currentView) {
			case ECurrentView.LOBBY:
				return "GAME_LOBBY_TITLE";
			case ECurrentView.SETTINGS:
				return "GAME_SETTINGS_TITLE";
			case ECurrentView.PLAYING:
				return "GAME_PLAYING_TITLE";
		}
		return "GAME_LOBBY_TITLE";
	}, [currentView]);

	//====================== EVENTS ======================
	if (!game.current) return <></>;

	return (
		<CGamePaper
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			position="relative"
			sx={{
				height: "100%",
				display: "flex",
				overflow: "hidden",
			}}
			title={currentTitle}
		>
			{currentView == ECurrentView.LOBBY && (
				<PGameLobby
					status={status}
					players={players}
					settings={settings}
					game={game}
					onOpenSettings={() => {
						setCurrentView(ECurrentView.SETTINGS);
					}}
				/>
			)}
			{currentView == ECurrentView.SETTINGS && (
				<PGameSettings
					game={game}
					settings={settings}
					onReturnToLobby={() => {
						setCurrentView(ECurrentView.LOBBY);
					}}
				/>
			)}
			{currentView == ECurrentView.PLAYING && (
				<PGameRound
					game={game}
					status={status}
					settings={settings}
					rounds={rounds}
					players={players}
					volume={volume}
					muted={muted}
					results={results}
					answerRef={answerRef}
				/>
			)}
		</CGamePaper>
	);
}

export default PGameViews;
