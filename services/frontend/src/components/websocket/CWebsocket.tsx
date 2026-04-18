import { useContext, useEffect, type ReactNode, createContext, type Context, useRef } from "react";
import useWebSocket, { ReadyState, type SendMessage } from "react-use-websocket";
import { WS_ADRESS, WS_ADRESS_WMS } from "../../constants";
import type { IWSContext, IWSContextModule, TWSModuleName, TWSRcv } from "../../types/websocket";

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
//                      FUNCTIONS
//--------------------------------------------------
function wsGetModule(
	moduleTarget: string,
	modules: IWSContextModule[],
	sendMessage?: SendMessage,
): IWSContextModule {
	const module: IWSContextModule | undefined = modules.find((value: IWSContextModule) => {
		return value.target == moduleTarget;
	});
	if (!module) {
		modules.push({
			target: moduleTarget,
			messages: [],
			count: 0,
			getLast() {
				if (this.messages.length == 0) return undefined;
				const retValue: TWSRcv = this.messages.splice(0, 1)[0];
				this.count = this.messages.length;
				return retValue;
			},
			setOnUpdate(func: () => void) {
				this.onUpdate = func;
			},
			sendMessage: sendMessage
				? sendMessage
				: () => {
						console.error("Invalid send message function");
					},
			onUpdate: undefined,
		});
		return modules[modules.length - 1];
	}
	return module;
}

//--------------------------------------------------
//                        HOOKS
//--------------------------------------------------
const wsContext: Context<IWSContext | null> = createContext<IWSContext | null>(null);

export const useWS = (moduleTarget: TWSModuleName): IWSContextModule => {
	const context: IWSContext | null = useContext(wsContext);
	if (!context) throw "WS: Ixvalid wsContext";
	const module: IWSContextModule = wsGetModule(
		moduleTarget,
		context.modules.current,
		context.sendMessage,
	);
	return module;
};

//--------------------------------------------------
//                       NODE
//--------------------------------------------------
interface AppWebsocketProps {
	children: ReactNode;
}

function CWebsocket({ children }: AppWebsocketProps) {
	const { sendMessage, lastMessage, readyState } = useWebSocket(
		import.meta.env.MODE !== "mock" && import.meta.env.MODE !== "test"
			? WS_ADRESS
			: WS_ADRESS_WMS,
		{
			skipAssert: true,
			//shouldReconnect: (_) => true,
		},
	);
	const modules = useRef<IWSContextModule[]>([]);

	useEffect(() => {
		wsStatus = readyState;
		console.log(
			"WS Status changed: %c" + wsConnectionStatus[wsStatus],
			"font-weight: 900; color: " + wsConnectionStatusColor[wsStatus],
		);
	}, [readyState]);

	useEffect(() => {
		if (!lastMessage?.data) return;

		const currentData: TWSRcv =
			typeof lastMessage.data == "string"
				? (JSON.parse(lastMessage.data) as TWSRcv)
				: (lastMessage.data as TWSRcv);
		const targetModule = wsGetModule(currentData.target, modules.current);

		targetModule.messages.push(currentData);
		targetModule.count = targetModule.messages.length;
		if (targetModule.onUpdate) targetModule.onUpdate();
	}, [lastMessage, modules]);

	return (
		<wsContext.Provider value={{ modules: modules, sendMessage }}>
			{children}
		</wsContext.Provider>
	);
}

export default CWebsocket;
