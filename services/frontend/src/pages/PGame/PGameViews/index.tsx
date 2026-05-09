import CGamePaper from "../../../components/surfaces/CGamePaper";
import type { IGameData, IGamePlayer } from "../../../types/game";
import PGameLobby from "./PGameLobby";

interface PGameViewsProps {
	game: IGameData;
	players: IGamePlayer[];
}

function PGameViews({ game, players }: PGameViewsProps) {
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
			<PGameLobby players={players} game={game}></PGameLobby>
		</CGamePaper>
	);
}

export default PGameViews;
