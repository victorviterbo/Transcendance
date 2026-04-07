import type { RefObject } from "react";
import type { SendMessage } from "react-use-websocket";

export type TWSConnectionType = "CONNECTING" | "OPEN" | "CLOSED" | "ERROR";

export type TWSModuleName = "test_counter_event" | "test_counter" | "test_info";

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
			target: Extract<TWSModuleName, "test_counter_event">;
	  }
	| {
			target: Extract<TWSModuleName, "test_counter">;
			count: number;
	  }
	| {
			target: Extract<TWSModuleName, "test_info">;
			info: string;
	  };
