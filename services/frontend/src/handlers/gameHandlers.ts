import type { IGameChatMsg, IGameData, IGamePlayer } from "../types/game";

//====================== PLAYER LISTS ======================
export const gameOnPlayerJoin = (Game: IGameData, Player: IGamePlayer) => {
	if (Game.players.find((local: IGamePlayer) => local.user.uid == Player.user.uid)) return;
	Game.players.push(Player);
	Game.players = structuredClone(Game.players);
};

export const gameOnPlayerLeave = (Game: IGameData, Player: IGamePlayer) => {
	const found: number = Game.players.findIndex(
		(local: IGamePlayer) => local.user.uid == Player.user.uid,
	);
	if (found == -1) return;
	Game.players.splice(found, 1);
	Game.players = structuredClone(Game.players);
};

export const gameOnPlayerUpdate = (Game: IGameData, Players: IGamePlayer[]) => {
	Game.players = structuredClone(Players);
};

export const gameOnMessageNew = (Game: IGameData, Message: IGameChatMsg, setGame:  React.Dispatch<React.SetStateAction<IGameData | undefined>>) => {
	if(Game.chat.find((msg: IGameChatMsg) => msg.uid == Message.uid))
		return;
	Game.chat.push(Message);
	Game.chat = structuredClone(Game.chat);
	setGame({...Game});
}

export const gameOnMessageUpdate = (Game: IGameData, Message: IGameChatMsg[]) => {
	Game.chat = structuredClone(Message);
}