import type { MUSIC_TAGS } from "../constants";
import type { IErrorStruct } from "./error";

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

export interface IGamePlayerResult {
	user: IGameUser;
	titleFound: boolean;
	artistFound: boolean;
	time: number;
	ranking: number;
	points: number;
}

export interface IGamePlayer {
	user: IGameUser;
	points: number;
	host?: boolean;
	self?: boolean;
	colorid?: number;
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
export type TGamePhase = "waiting" | "started" | "count" | "playing_round" | "playing_break" | "finish";
export interface IGameStatus {
	phase: TGamePhase;
	round: number;
	keyTime: number;
}

export interface IGameTrack {
	title?: string;
	artist?: string;
	preview?: string;
	artwork?: string;
}

export interface IGamePlayerAnswer {
	validated: boolean;
	message: string;
	time: number;
	titleFound: boolean;
	artistFound: boolean;
}



export type TRoundPhase = "not-done" | "playing" | "done";
export interface IGameRound {
	track: IGameTrack;
	phase: TRoundPhase;
	titleFound: boolean;
	artistFound: boolean;
	titleFoundAt?: number;
	artistFoundAt?: number;
	points: number;
	time: number;
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
