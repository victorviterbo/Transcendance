import {
	useContext,
	useEffect,
	type ReactNode,
	createContext,
	type Context,
	useState,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WS_ADRESS } from "../../constants";
import type {
	IWSContext,
	IWSContextModule,
	IWSModuleName,
	TWebsocketRcv,
} from "../../types/websocket";

//--------------------------------------------------
//                      EXPORTS
//--------------------------------------------------
export const wsConnectionStatus: Record<number, string> = {
	[ReadyState.CONNECTING]: "Connecting",
	[ReadyState.OPEN]: "Open",
	[ReadyState.CLOSING]: "Closing",
	[ReadyState.CLOSED]: "Closed",
	[ReadyState.UNINSTANTIATED]: "Uninstantiated",
};
export const wsConnectionStatusColor: Record<number, string> = {
	[ReadyState.CONNECTING]: "#ffaa00",
	[ReadyState.OPEN]: "#44d13d",
	[ReadyState.CLOSING]: "#bb60d1",
	[ReadyState.CLOSED]: "#7773e4",
	[ReadyState.UNINSTANTIATED]: "#ff0022",
};
export let wsStatus: number = -1;

//--------------------------------------------------
//                      HOOKS
//--------------------------------------------------

const wsContext: Context<IWSContext> = createContext({
	modules: [],
} as IWSContext);

function wsGetModule(moduleTarget: string, context: IWSContext): IWSContextModule {
	const module: IWSContextModule | undefined = context.modules.find((value: IWSContextModule) => {
		return value.target == moduleTarget;
	});
	if (!module) {
		context.modules.push({
			target: moduleTarget,
			messages: [],
			count: 0,
			getLast() {
				if (this.messages.length == 0) return undefined;
				const retValue: TWebsocketRcv = this.messages.splice(0, 1)[0];
				this.count = this.messages.length;
				return retValue;
			},
			onUpdate: undefined,
		});
		return wsGetModule(moduleTarget, context);
	}
	return module;
}

export const useWS = (moduleTarget: IWSModuleName) => {
	const context: IWSContext = useContext(wsContext);
	const module: IWSContextModule = wsGetModule(moduleTarget, context);
	return module;
};

//--------------------------------------------------
//                       NODE
//--------------------------------------------------
interface AppWebsocketProps {
	children: ReactNode;
}

function CWebsocket({ children }: AppWebsocketProps) {
	const { lastMessage, readyState } = useWebSocket(WS_ADRESS, {
		skipAssert: true,
	});
	const [modules] = useState<IWSContextModule[]>([]);

	useEffect(() => {
		wsStatus = readyState;
		console.log(
			"WS Status changed: %c" + wsConnectionStatus[wsStatus],
			"font-weight: 900; color: " + wsConnectionStatusColor[wsStatus],
		);
	}, [readyState]);

	useEffect(() => {
		if (!lastMessage?.data) return;

		const currentData: TWebsocketRcv =
			typeof lastMessage.data == "string"
				? (JSON.parse(lastMessage.data) as TWebsocketRcv)
				: (lastMessage.data as TWebsocketRcv);
		const targetModule = wsGetModule(currentData.target, { modules });
		targetModule.messages.push(currentData);
		targetModule.count = targetModule.messages.length;
		if (targetModule.onUpdate) targetModule.onUpdate();
	}, [lastMessage, modules]);

	return <wsContext.Provider value={{ modules }}>{children}</wsContext.Provider>;
}

export default CWebsocket;
