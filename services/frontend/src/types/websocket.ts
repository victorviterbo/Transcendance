import type { RefObject } from "react";
import type { SendMessage } from "react-use-websocket";
import type { IFriendMessage, TNotif } from "./socials";
import type { IExtUserInfo } from "./user";
import type { IGameChatMsg, IGamePlayer } from "./game";

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
	messages: TWSRcv[];
	count: number;
	getLast(this: IWSContextModule): TWSRcv | undefined;
	setOnUpdate(func: () => void): void;
	onUpdate?: () => void;
	sendMessage: SendMessage;
}

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

	//GAME
	| {
			target: Extract<TWSModuleName, "game">;
			event: "player-join" | "player-leave";
			player: IGamePlayer;
			gameid: string;
			gameuid: string;
	  }
	| {
			target: Extract<TWSModuleName, "game">;
			event: "players-update";
			players: IGamePlayer[];
			gameid: string;
			gameuid: string;
	  }
	| {
			target: Extract<TWSModuleName, "game">;
			event: "message-new";
			message: IGameChatMsg;
			gameid: string;
			gameuid: string;
	  }
	| {
			target: Extract<TWSModuleName, "game">;
			event: "message-update";
			messages: IGameChatMsg[];
			gameid: string;
			gameuid: string;
	  }

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
	| {
			target: Extract<TWSModuleName, "game">;
			event: "join";
			gameid: string;
			gameuid: string;
	  }
	| {
			target: Extract<TWSModuleName, "game">;
			event: "message-send";
			gameid: string;
			gameuid: string;
			message: string;
	  }
	| {
			target: Extract<TWSModuleName, "test_counter_event">;
	  };
