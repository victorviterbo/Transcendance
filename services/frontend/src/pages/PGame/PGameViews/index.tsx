import { useState } from "react";
import CGamePaper from "../../../components/surfaces/CGamePaper";
import type { IGameData, IGamePlayer, IGameSettings } from "../../../types/game";
import PGameLobby from "./PGameLobby";
import PGameSettings from "./PGameSettings";

interface PGameViewsProps {
	game: IGameData;
	players: IGamePlayer[];
	settings: IGameSettings;
	onSettingsChanged: (newSettings: IGameSettings) => void;
}

type ECurrentViewType = {
	LOBBY: number;
	SETTINGS: number;
};

const ECurrentView: ECurrentViewType = {
	LOBBY: 0,
	SETTINGS: 1,
};

function PGameViews({ game, players, settings, onSettingsChanged }: PGameViewsProps) {
	const [currentView, setCurrentView] = useState<number>(ECurrentView.LOBBY);

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
			title={"GAME_LOBBY_TITLE"}
		>
			{currentView == ECurrentView.LOBBY && (
				<PGameLobby
					players={players}
					game={game}
					onOpenSettings={() => {
						setCurrentView(ECurrentView.SETTINGS);
					}}
				></PGameLobby>
			)}
			{currentView == ECurrentView.SETTINGS && (
				<PGameSettings
					onSettingsChanged={onSettingsChanged}
					settings={settings}
				></PGameSettings>
			)}
		</CGamePaper>
	);
}

export default PGameViews;
