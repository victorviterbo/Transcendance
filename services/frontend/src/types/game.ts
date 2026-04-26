import type { IExtUserInfo } from "./user";

export interface IGamePlayer {
	user: IExtUserInfo
	points: number
}

export interface IGameData {
	players: IGamePlayer[]
	maxPlayers: number;
}