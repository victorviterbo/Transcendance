import { useMemo, useState } from "react";
import CGamePaper from "../../../components/surfaces/CGamePaper";
import type {
	IGameData,
	IGamePlayer,
	IGameRound,
	IGameSettings,
	IGameStatus,
} from "../../../types/game";
import PGameLobby from "./PGameLobby";
import PGameSettings from "./PGameSettings";
import PGameRound from "./PGameRound";

interface PGameViewsProps {
	game: IGameData;
	status: IGameStatus;
	players: IGamePlayer[];
	settings: IGameSettings;
	rounds: IGameRound[];
	onSettingsChanged: (newSettings: IGameSettings) => void;
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
	settings,
	onSettingsChanged,
}: PGameViewsProps) {
	//====================== STATES ======================
	const getCurrentView = (): number => {
		if (status.phase == "playing_round") return ECurrentView.PLAYING;
		return ECurrentView.LOBBY;
	};

	const [currentView, setCurrentView] = useState<number>(getCurrentView());

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
					onSettingsChanged={onSettingsChanged}
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
				/>
			)}
		</CGamePaper>
	);
}

export default PGameViews;
