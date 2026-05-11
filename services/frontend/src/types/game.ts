import type { IErrorStruct } from "./error";
import type { IExtUserInfo } from "./user";

//====================== CHAT ======================
export type TGameChatType = "message" | "joined" | "leaved" | "guessed" | "found";

export interface IGameChatMsg {
	useruid: string;
	username: string;
	messageuid: string;

	type: TGameChatType;
	message?: string;
}

//====================== PLAYER ======================
export interface IGamePlayer {
	user: IExtUserInfo;
	points: number;
	host: boolean;
	colorid: number;
}

//====================== SETTINGS ======================
export type TScoreOption = "speed" | "normal";
export type TGameScope = "public" | "private";

export interface IGameSettings {
	tags: Record<string, boolean>;
	nbMusic: number;
	timer: number;
	breakTimer: number;
	seeOthers: boolean;
	fuzzy: boolean;
	scoreOption: TScoreOption;
	scope: TGameScope;
	code: string;
}

//====================== COMMON ======================
export interface IGameData {
	id: string;
	uid: string;
	name: string;
	settings: IGameSettings;
	chat: IGameChatMsg[];
	players: IGamePlayer[];
	maxPlayers: number;
	isHost: boolean;
}

export interface IGameDataRes {
	game: IGameData;
	error?: IErrorStruct;
}
