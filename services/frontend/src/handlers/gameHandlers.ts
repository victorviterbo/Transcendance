import type { IGameChatMsg, IGameData, IGamePlayer, IGameSettings } from "../types/game";

//====================== PLAYER LISTS ======================
export const gameOnPlayerJoin = (
	Game: IGameData,
	Player: IGamePlayer,
	setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>,
) => {
	if (Game.players.find((local: IGamePlayer) => local.user.uid == Player.user.uid)) return;
	Game.players.push(Player);
	Game.players = structuredClone(Game.players);
	setUsers(Game.players);
};

export const gameOnPlayerLeave = (
	Game: IGameData,
	Player: IGamePlayer,
	setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>,
) => {
	const found: number = Game.players.findIndex(
		(local: IGamePlayer) => local.user.uid == Player.user.uid,
	);
	if (found == -1) return;
	Game.players.splice(found, 1);
	Game.players = structuredClone(Game.players);
	setUsers(Game.players);
};

export const gameOnPlayerUpdate = (
	Game: IGameData,
	Players: IGamePlayer[],
	setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>,
) => {
	Game.players = structuredClone(Players);
	setUsers(Game.players);
};

export const gameOnMessageNew = (
	Game: IGameData,
	Message: IGameChatMsg,
	setChat: React.Dispatch<React.SetStateAction<IGameChatMsg[]>>,
) => {
	if (Game.chat.find((msg: IGameChatMsg) => msg.messageuid == Message.messageuid)) return;
	Game.chat.push(Message);
	Game.chat = structuredClone(Game.chat);
	setChat(structuredClone(Game.chat).reverse());
};

export const gameOnMessageUpdate = (
	Game: IGameData,
	Message: IGameChatMsg[],
	setChat: React.Dispatch<React.SetStateAction<IGameChatMsg[]>>,
) => {
	Game.chat = structuredClone(Message);
	setChat(structuredClone(Game.chat).reverse());
};

//--------------------------------------------------
//                 LOCAL EVENTS
//--------------------------------------------------
export const gameOnSettingsChanged = (
	Game: IGameData | undefined,
	Settings: IGameSettings | undefined,
	setSettings: React.Dispatch<React.SetStateAction<IGameSettings | undefined>>,
	NewSettings?: IGameSettings,
) => {
	if (!Game || !Settings) return;
	Game.settings = NewSettings ? NewSettings : structuredClone(Settings);
	setSettings(Game.settings);
};

//--------------------------------------------------
//                     UTILS
//--------------------------------------------------
export const gameThemeCount = (tags: Record<string, boolean>): number => {
	let count: number = 0;
	Object.keys(tags).forEach((key: string) => {
		if (tags[key]) count++;
	});
	return count;
};
