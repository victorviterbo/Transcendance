export type IWSModuleName = "chat" | "list";

export interface IWSContext {
	modules: IWSContextModule[];
}

export interface IWSContextModule {
	target: string;
	messages: TWebsocketRcv[];
	count: number;
	getLast(this: IWSContextModule): TWebsocketRcv | undefined;
	onUpdate?: () => void;
}

export type TWebsocketRcv =
	| {
			target: Extract<IWSModuleName, "chat">;
			count: number;
	  }
	| {
			target: Extract<IWSModuleName, "list">;
			info: string;
	  };
