import type { IGameData, IGamePlayer } from "../types/game";

//====================== PLAYER LISTS ======================
export const gameOnPlayerJoin = (Game: IGameData, Player: IGamePlayer) => {
	if (Game.players.find((local: IGamePlayer) => local.user.uid == Player.user.uid)) return;
	Game.players.push(Player);
	Game.players = structuredClone(Game.players);
};
