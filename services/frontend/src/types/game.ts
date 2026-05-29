import type { MUSIC_TAGS } from "../constants";
import type { IErrorStruct } from "./error";
import type { IExtUserInfo } from "./user";

//====================== LIST ======================
export type TGameGenre = (typeof MUSIC_TAGS)[number];

export interface IGameListEntry {
	uid: string;
	name: string;
	genres: TGameGenre[];
	playerCount: number;
	playerMax: number;
}

export interface IGameListResponse {
	rooms: IGameListEntry[];
}

//====================== CREATE ======================
export type TGameVisibility = "public" | "private" | "friends";

export interface IGameCreationRequest {
	name: string;
	visibility: TGameVisibility;
}

export interface IGameCreationResponse {
	uid: string;
}

//====================== USER ======================
export interface IGameUser {
	username: string;
	avatar: string;
	guest: boolean;
	uid: string;
}



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
export type TScoreOption = "speed" | "normal" | "armageddon";

export interface IGameSettings {
	tags?: Record<string, boolean>;
	genres: string[]
	mode: TScoreOption;
	trackCount: number;
	playbackDuration: number;
	breakDuration: number;
	reveal: boolean;
	fuzzy: boolean;
}

//====================== STATUS ======================
export type TGamePhase = "waiting" | "playing_round" | "playing_break" | "finish";
export type TGameVisibility = "public" | "private" | "friends";

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

export interface IGameTitle {
	title?: string;
	artist?: string;
	preview: string;
	artwork?: string;
}

export type TRoundPhase = "not-done" | "playing" | "break" | "done";
export interface IGameRound {
	title: IGameTitle;
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
