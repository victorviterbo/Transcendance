import { useEffect, useState } from "react";
import CGamePaper from "../../components/surfaces/CGamePaper";
import type { IGameData, IGamePlayer } from "../../types/game";
import type { GPageProps } from "../common/GPageBases";
import PGameLBoardNode from "./PGameLBoardNode";

interface PGameLBoardProps extends GPageProps {
	game: IGameData
}

function PGameLBoard({game}: PGameLBoardProps) {

	const [users, setUsers] = useState<IGamePlayer[]>([]);

	useEffect(() => {
		async function updatePlayers() {
			setUsers(game.players)
		}
		updatePlayers();
	}, [game.players])

	return <CGamePaper title={"GAME_LEADER_BOARD"}>
		{users.map((user: IGamePlayer, index: number) => {
			return <PGameLBoardNode position={index} user={user} key={user.user.uid}></PGameLBoardNode>
		})}
	</CGamePaper>;
}

export default PGameLBoard;
