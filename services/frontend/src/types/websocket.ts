import type { RefObject } from "react";
import type { SendMessage } from "react-use-websocket";
import type { IFriendMessage, TNotif } from "./socials";
import type { IExtUserInfo } from "./user";
import type { IGamePlayer, IGameSettings, IGameTrack, IGameUser, TGamePhase, TGameVisibility } from "./game";
//import type { IGameChatMsg, IGamePlayer, IGameSettings } from "./game";

export type TWSConnectionType = "CONNECTING" | "OPEN" | "CLOSED" | "ERROR";

export type TWSModuleName =
	| "friend-chat"
	| "friend-request"
	| "notif"
	| "game"
	| "test_counter_event"
	| "test_counter";

export interface IWSContext {
	modules: RefObject<IWSContextModule[]>;
	sendMessage: SendMessage;
}

export interface IWSContextModule {
	target: string;
	messages: (TWSRcv | IWSGameSendEvent)[];
	count: number;
	getLast(this: IWSContextModule): TWSRcv | IWSGameSendEvent | undefined;
	setOnUpdate(func: () => void): void;
	onUpdate?: () => void;
	sendMessage: SendMessage;
}


//SHARED EVENT
export type TWSRcv =
	| {
			target: Extract<TWSModuleName, "friend-chat">;
			event: "update_status" | "new";
			message: IFriendMessage;
	  }
	| {
			target: Extract<TWSModuleName, "notif">;
			event: "new";
			notif: TNotif;
	  }
	| {
			target: Extract<TWSModuleName, "friend-request">;
			event: "new-incoming";
			user: IExtUserInfo;
	  }


	//OLD
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "player-join" | "player-leave";
	// 		player: IGamePlayer;
	// 		gameid: string;
	// 		gameuid: string;
	//   }
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "players-update";
	// 		players: IGamePlayer[];
	// 		gameid: string;
	// 		gameuid: string;
	//   }
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "message-new";
	// 		message: IGameChatMsg;
	// 		gameid: string;
	// 		gameuid: string;
	//   }
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "message-update";
	// 		messages: IGameChatMsg[];
	// 		gameid: string;
	// 		gameuid: string;
	//   }
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "settings-update";
	// 		gameid: string;
	// 		gameuid: string;
	// 		settings: IGameSettings;
	//   }

	//GAME
	| {
			target: Extract<TWSModuleName, "test_counter">;
			count: number;
	  };

export type TWSSend =
	| {
			target: Extract<TWSModuleName, "friend-chat">;
			event: "send" | "open" | "close";
			message?: IFriendMessage;
			to?: string;
			toUid?: string;
	  }
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "join";
	// 		gameid: string;
	// 		gameuid: string;
	//   }
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "message-send";
	// 		gameid: string;
	// 		gameuid: string;
	// 		message: string;
	//   }
	// | {
	// 		target: Extract<TWSModuleName, "game">;
	// 		event: "settings-update";
	// 		gameid: string;
	// 		gameuid: string;
	// 		settings: IGameSettings;
	//   }
	| {
			target: Extract<TWSModuleName, "test_counter_event">;
	  };


//--------------------------------------------------
//                  GAME DATA
//--------------------------------------------------
	  //--------------------- DATA ---------------------
export interface TWSGameInfo {
	uid: string;
    name: string;
    owner: IGameUser,
    status: TGamePhase,
    round: number,
    visibility: TGameVisibility,
	maxPlayers: number;
}

export interface TWSRoundInfo {
	track: IGameTrack;
    titleFound: boolean;
    artistFound: boolean,
    time: number,
    ranking: number,
    points: number,
	round: number;
}



	  //--------------------- EVENTS ---------------------
export type IWSGameEventRcvList = "game_join" 
	| "settings_update" 
	| "game_start"
	| "answer_submit"

export type IWSGameEventSndList = "player_joined" | "player_left" | "game_info" 
	| "settings_updated" 
	| "game_started"
	| "round_preview"
	| "round_started"


export interface IWSGameEvent {
	target: Extract<TWSModuleName, "game">;
	event: IWSGameEventRcvList | IWSGameEventSndList;
}

	//RCV (Client to Server)
export interface IWSGameRCVEvent extends IWSGameEvent {
	event: IWSGameEventRcvList;
	uid: string;
}
export interface IWSGameRCVEventSettings extends IWSGameRCVEvent {
	event: Extract<IWSGameEventRcvList, "settings_update">;
	settings: IGameSettings;
}
export interface IWSGameRCVEventAnswer extends IWSGameRCVEvent {
	event: Extract<IWSGameEventRcvList, "answer_submit">;
	answer: string;
	time: number
}


	//Send(Client to Server)
export interface IWSGameSendEvent extends IWSGameEvent {
	event: IWSGameEventSndList;
	uid: string;
	self: IGameUser;
}

export interface IWSGameSendEventPlayerManage extends IWSGameSendEvent {
	event: Extract<IWSGameEventSndList, "player_joined" | "player_left">;
	player: IGamePlayer;
}

export interface IWSGameSendEventGameInfo extends IWSGameSendEvent {
	event: Extract<IWSGameEventSndList, "game_info">;
	game: TWSGameInfo;
	settings: IGameSettings;
	leaderboard: IGamePlayer[];
	history: TWSRoundInfo[];
}

export interface IWSGameSendEventSettings extends IWSGameSendEvent {
	event: Extract<IWSGameEventSndList, "settings_updated" | "game_started">;
	settings: IGameSettings;
}

export interface IWSGameSendEventRoundStart extends IWSGameSendEvent {
	event: Extract<IWSGameEventSndList, "round_preview" | "round_started">;
	round: number;
	preview: string;
	playbackDuration: number;
}