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
export interface IGamePlayerRoundStatus {
	lastestTime: number;
	artistFound: boolean;
	titleFound: boolean;
}

export interface IGamePlayer {
	user: IExtUserInfo;
	points: number;
	host: boolean;
	colorid: number;
	current: IGamePlayerRoundStatus;
}

//====================== SETTINGS ======================
export type TScoreOption = "speed" | "normal" | "arma";
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

//====================== STATUS ======================
export type TGamePhase = "waiting" | "playing_round" | "playing_break" | "finish";
export interface IGameStatus {
	phase: TGamePhase;
	round: number;
	keyTime: number;
}

export interface IGamePlayerAnswer {
	message: string;
	time: number;
	titleFound: boolean;
	artistFound: boolean;
}

export type TRoundPhase = "not-done" | "playing" | "break" | "done";
export interface IGameRound {
	previewLink: string;
	titleFound: number;
	artistFound: number;
	points: number;
	time: number;
	phase: TRoundPhase;
	answers: IGamePlayerAnswer[];
}

//====================== COMMON ======================
export interface IGameData {
	id: string;
	uid: string;
	name: string;

	settings: IGameSettings;
	status: IGameStatus;
	rounds: IGameRound[];

	chat: IGameChatMsg[];
	players: IGamePlayer[];
	maxPlayers: number;

	isHost: boolean;
}

export interface IGameDataRes {
	game: IGameData;
	error?: IErrorStruct;
}
