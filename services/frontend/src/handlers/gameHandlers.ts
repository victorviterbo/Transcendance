import type { IGameChatMsg, IGameData, IGamePlayer } from "../types/game";

//====================== PLAYER LISTS ======================
export const gameOnPlayerJoin = (Game: IGameData, Player: IGamePlayer, setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>) => {
	if (Game.players.find((local: IGamePlayer) => local.user.uid == Player.user.uid)) return;
	Game.players.push(Player);
	Game.players = structuredClone(Game.players);
	setUsers(Game.players);
};

export const gameOnPlayerLeave = (Game: IGameData, Player: IGamePlayer, setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>) => {
	const found: number = Game.players.findIndex(
		(local: IGamePlayer) => local.user.uid == Player.user.uid,
	);
	if (found == -1) return;
	Game.players.splice(found, 1);
	Game.players = structuredClone(Game.players);
	setUsers(Game.players);
};

export const gameOnPlayerUpdate = (Game: IGameData, Players: IGamePlayer[], setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>) => {
	Game.players = structuredClone(Players);
	setUsers(Game.players);
};

export const gameOnMessageNew = (Game: IGameData, Message: IGameChatMsg, setChat:  React.Dispatch<React.SetStateAction<IGameChatMsg[]>>) => {
	if(Game.chat.find((msg: IGameChatMsg) => msg.uid == Message.uid))
		return;
	Game.chat.push(Message);
	Game.chat = structuredClone(Game.chat);
	setChat(structuredClone(Game.chat).reverse());
}

export const gameOnMessageUpdate = (Game: IGameData, Message: IGameChatMsg[], setChat:  React.Dispatch<React.SetStateAction<IGameChatMsg[]>>) => {
	Game.chat = structuredClone(Message);
	setChat(structuredClone(Game.chat).reverse());
}