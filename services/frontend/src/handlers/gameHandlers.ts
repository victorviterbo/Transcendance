import type { SendMessage } from "react-use-websocket";
import type { IGameChatMsg, IGameData, IGamePlayer, IGameSettings, IGameStatus, IGameUser, TGameVisibility } from "../types/game";
import type { IWSGameEventRcvList, IWSGameRCVEvent, IWSGameSendEvent, IWSGameSendEventGameInfo, IWSGameSendEventPlayerJoined } from "../types/websocket";
import type { ReactNode } from "react";
import { MUSIC_TAGS } from "../constants";


export interface IGameInstanceCallbacks {
	setReady: React.Dispatch<React.SetStateAction<boolean>>;
	setError: React.Dispatch<React.SetStateAction<ReactNode>>;
	setStatus: React.Dispatch<React.SetStateAction<IGameStatus | undefined>>;
	setSettings: React.Dispatch<React.SetStateAction<IGameSettings | undefined>>
	setPlayers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>
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
	isHost: boolean = false;
	visibility: TGameVisibility = "public";
	maxPlayers: number = 0;

		//--------------------- Status ---------------------
	status?: IGameStatus;

		//--------------------- Settings ---------------------
	settings?: IGameSettings;

		//--------------------- PLayers ---------------------
	players: IGamePlayer[] = [];

		//--------------------- Callbacks ---------------------
	callbacks: IGameInstanceCallbacks;
	
		//--------------------- Other ---------------------
	self?: IGameUser ;
	lastColorId: number = 0;


	//====================== EVENTS ======================
	onPlayerJoined(data: IWSGameSendEventPlayerJoined) {
		this.log("Player: '" + data.player.user.username + "' has joined");
		this.players.push(data.player);
		this.updatePlayers();
	}
	onGameJoined(data: IWSGameSendEventGameInfo) {
		this.log("Game joined");
		this.log("Parsing data");
		this.name = data.game.name;
		this.host = data.game.owner;
		this.isHost = data.game.owner.uid == data.self.uid
		this.status = {
			phase: data.game.status,
			round: data.game.round,
			keyTime: 0,
		};
		this.settings = data.settings;

		this.maxPlayers= data.game.maxPlayers
		this.visibility = data.game.visibility;

		this.players = data.leaderboard;

		this.self = data.self;

		this.updateAll();
		this.callbacks.setReady(true);
		this.log("Game ready");
	}


	//====================== FUNCTIONS ======================
		//--------------------- Update ---------------------
	updateAll() {
		this.updateStatus();
		this.updateSettings();
		this.updatePlayers();
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
	updatePlayers() {
		this.players.forEach((player: IGamePlayer) => {
			if(player.colorid == undefined)
			{
				player.colorid = this.lastColorId % 10
				this.lastColorId++;
			}
			player.host = player.user.uid == this.host?.uid
			player.self = player.user.uid == this.self?.uid
		})
		this.players = structuredClone(this.players);
		this.callbacks.setPlayers(this.players);
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
	rcv(event: IWSGameSendEvent) {
		if(event.target != "game")
			return;
		if(event.event == "player_joined")
			this.onPlayerJoined(event as IWSGameSendEventPlayerJoined)
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
