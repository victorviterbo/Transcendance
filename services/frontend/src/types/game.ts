import type { IErrorStruct } from "./error";
import type { IExtUserInfo } from "./user";

export interface IGamePlayer {
	user: IExtUserInfo;
	points: number;
	host: boolean;
}

export interface IGameData {
	players: IGamePlayer[];
	maxPlayers: number;
	isHost: boolean;
	id: string;
}

export interface IGameDataRes {
	game: IGameData;
	error?: IErrorStruct;
}
