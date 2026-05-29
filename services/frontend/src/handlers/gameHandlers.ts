import type { SendMessage } from "react-use-websocket";
import type { IGameChatMsg, IGameData, IGamePlayer, IGameSettings, IGameStatus, IGameUser, TGameVisibility } from "../types/game";
import type { IWSGameEventRcvList, IWSGameRCVEvent, IWSGameSendEvent, IWSGameSendEventGameInfo } from "../types/websocket";
import type { ReactNode } from "react";
import { MUSIC_TAGS } from "../constants";


export interface IGameInstanceCallbacks {
	setReady: React.Dispatch<React.SetStateAction<boolean>>;
	setError: React.Dispatch<React.SetStateAction<ReactNode>>;
	setStatus: React.Dispatch<React.SetStateAction<IGameStatus | undefined>>;
	setSettings: React.Dispatch<React.SetStateAction<IGameSettings | undefined>>
	sendMessage: SendMessage;
}

export class GameInstance {

	//====================== CONSTRUCTOR ======================
	constructor(uid: string, callbacks: IGameInstanceCallbacks) {
		this.uid = uid;
		this.callbacks = callbacks;
		this.log("New game instance created");
		this.log("Loading....");

		//Joining
		this.send("game_join")
	}
	destroy() {
		this.uid = "";
		this.log("Destroying game instance");
	}
	
	//====================== DATA ======================
		//--------------------- Info ---------------------
	uid: string;
	name: string = "N/A";
	host?: IGameUser;
	visibility: TGameVisibility = "public";

		//--------------------- Status ---------------------
	status?: IGameStatus;

		//--------------------- Settings ---------------------
	settings?: IGameSettings;

		//--------------------- Callbacks ---------------------
	callbacks: IGameInstanceCallbacks;


	//====================== EVENTS ======================
	onGameJoined(data: IWSGameSendEventGameInfo) {
		this.name = data.game.name;
		this.host = data.game.owner;
		this.status = {
			phase: data.game.status,
			round: data.game.round,
			keyTime: 0,
		};
		this.visibility = data.game.visibility;
		this.settings = data.settings;
		this.updateAll();
		this.callbacks.setReady(true);
	}


	//====================== FUNCTIONS ======================
		//--------------------- Update ---------------------
	updateAll() {
		this.updateStatus();
		this.updateSettings();
	}
	updateStatus() {
		this.status = structuredClone(this.status);
		this.callbacks.setStatus(this.status);
	}
	updateSettings() {
		if(!this.settings)
		{
			this.callbacks.setSettings(undefined);
			return;
		}
		if(this.settings.genres.length > 0)
		{
			this.settings.tags = {};
			MUSIC_TAGS.forEach((tag: string) => {
				if(!this.settings || !this.settings.tags)
					return;
				this.settings.tags[tag] = this.settings.genres.find((tagSearch: string) => tagSearch == tag) ? true : false;
			})
		}
		else
			this.settings.tags = undefined;
		this.settings = structuredClone(this.settings);
		this.callbacks.setSettings(this.settings);
	}

		//--------------------- WS ---------------------
	send(event: IWSGameEventRcvList) {
		if(!this.check)
			return;

		this.log("Joining game");
		const data: IWSGameRCVEvent = {
			target: "game",
			event,
			uid: this.uid,
		}
		this.callbacks.sendMessage(JSON.stringify(data));
	}
	rcv(event: IWSGameSendEvent | IWSGameSendEventGameInfo) {
		if(event.target != "game")
			return;
		if(event.event == "game_info")
			this.onGameJoined(event as IWSGameSendEventGameInfo)
	}

		//--------------------- Check ---------------------
	check(): boolean {
		if(this.uid == "")
			return false;
		return true;
	}

		//--------------------- LOGs ---------------------
	log(MSG: string, ...Styling: string[]){
		console.log("[%cGAME%c]: " + MSG, "font-weight: 900; color: #2083d4", "font-weight: 400; color: white", ...Styling);
	}	
}





























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

export const gameOnSettingsUpdate = (
	Game: IGameData,
	Settings: IGameSettings,
	setSettings: React.Dispatch<React.SetStateAction<IGameSettings | undefined>>,
) => {
	Game.settings = structuredClone(Settings);
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
