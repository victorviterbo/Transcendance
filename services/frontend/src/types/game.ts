import type { IErrorStruct } from "./error";
import type { IExtUserInfo } from "./user";

//====================== CHAT ======================
export type TGameChatType = "message" | "joined" | "leaved" | "guessed" | "found";

export interface IGameChatMsg {
	userid: string;
	username: string;
	uid: string;

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

//====================== COMMON ======================
export interface IGameData {
	chat: IGameChatMsg[];
	players: IGamePlayer[];
	maxPlayers: number;
	isHost: boolean;
	id: string;
	uid: string;
}

export interface IGameDataRes {
	game: IGameData;
	error?: IErrorStruct;
}
