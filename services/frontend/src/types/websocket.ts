import type { RefObject } from "react";
import type { SendMessage } from "react-use-websocket";
import type { IFriendMessage } from "./friends";

export type TWSConnectionType = "CONNECTING" | "OPEN" | "CLOSED" | "ERROR";

export type TWSModuleName = "friend-chat" | "test_counter_event" | "test_counter";

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
			target: Extract<TWSModuleName, "test_counter_event">;
	  }
	| {
			target: Extract<TWSModuleName, "test_counter">;
			count: number;
	  };

export type TWSSend = {
	target: Extract<TWSModuleName, "friend-chat">;
	event: "new";
	message: string;
	date: string;
	to: string;
	toUid: string;
};
