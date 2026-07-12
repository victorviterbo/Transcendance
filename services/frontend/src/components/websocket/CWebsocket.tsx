import {
	useContext,
	useEffect,
	useState,
	type ReactNode,
	createContext,
	type Context,
	useRef,
} from "react";
import useWebSocket, { ReadyState, type SendMessage } from "react-use-websocket";
import { WS_ADDRESS, WS_ADDRESS_WMS } from "../../constants";
import type {
	IWSContext,
	IWSContextModule,
	IWSGameSendEvent,
	TWSModuleName,
	TWSRcv,
} from "../../types/websocket";
import { useAuth } from "../auth/CAuthProvider";
import GLoading from "../../pages/common/GLoading";
import GLost from "../../pages/common/GLost";
import { useNotif } from "../contexts/CAppNotifContext";
import { debugError, debugLog } from "../../utils/debug";

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
				const retValue: TWSRcv | IWSGameSendEvent = this.messages.splice(0, 1)[0];
				this.count = this.messages.length;
				return retValue;
			},
			setOnUpdate(func: () => void) {
				this.onUpdate = func;
			},
			sendMessage: sendMessage
				? sendMessage
				: () => {
						debugError("Invalid send message function");
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

export const useWSStatus = (): ReadyState => {
	const context: IWSContext | null = useContext(wsContext);
	if (!context) throw "WS: Ixvalid wsContext";
	return context.state;
};

//--------------------------------------------------
//                       NODE
//--------------------------------------------------
interface AppWebsocketProps {
	children: ReactNode;
	loading: ReactNode;
	lost: ReactNode;
}

function CWebsocket({ loading, lost, children }: AppWebsocketProps) {
	const pageInCache = useRef(false);
	const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(
		import.meta.env.MODE !== "mock" && import.meta.env.MODE !== "test"
			? WS_ADDRESS
			: WS_ADDRESS_WMS,
		{
			skipAssert: true,
			shouldReconnect: () => !pageInCache.current,
		},
	);
	const modules = useRef<IWSContextModule[]>([]);
	const lastReadMessage = useRef<MessageEvent<unknown> | undefined>(undefined);
	const { push } = useNotif();

	useEffect(() => {
		const handlePageHide = () => {
			pageInCache.current = true;
			getWebSocket()?.close(1000, "pagehide");
		};

		window.addEventListener("pagehide", handlePageHide);
		return () => window.removeEventListener("pagehide", handlePageHide);
	}, [getWebSocket]);

	useEffect(() => {
		wsStatus = readyState;
		debugLog(
			"WS Status changed: %c" + wsConnectionStatus[wsStatus],
			"font-weight: 900; color: " + wsConnectionStatusColor[wsStatus],
		);
	}, [readyState]);

	useEffect(() => {
		if (
			!lastMessage?.data ||
			(lastReadMessage.current && lastReadMessage.current == lastMessage)
		)
			return;

		const currentData: TWSRcv =
			typeof lastMessage.data == "string"
				? (JSON.parse(lastMessage.data) as TWSRcv)
				: (lastMessage.data as TWSRcv);

		lastReadMessage.current = lastMessage;
		if (currentData.target == "error") {
			push({
				severity: "error",
				message: currentData.message,
			});

			return;
		}

		const targetModule = wsGetModule(currentData.target, modules.current);

		targetModule.messages.push(currentData);
		targetModule.count = targetModule.messages.length;
		if (targetModule.onUpdate) targetModule.onUpdate();
	}, [lastMessage, modules, push]);

	return (
		<wsContext.Provider value={{ modules: modules, sendMessage, state: readyState }}>
			{(readyState == ReadyState.CONNECTING || readyState == ReadyState.UNINSTANTIATED) &&
				loading}
			{readyState == ReadyState.OPEN && children}
			{(readyState == ReadyState.CLOSING || readyState == ReadyState.CLOSED) && lost}
		</wsContext.Provider>
	);
}

interface CWebsocketContextProps {
	children: ReactNode;
}

function CWebsocketContext({ children }: CWebsocketContextProps) {
	const { status } = useAuth();
	const [pageGeneration, setPageGeneration] = useState(0);

	useEffect(() => {
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) setPageGeneration((generation) => generation + 1);
		};

		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, []);

	if (status == "loading") return <GLoading />;

	return (
		<>
			<CWebsocket key={`${status}-${pageGeneration}`} loading={<GLoading />} lost={<GLost />}>
				{children}
			</CWebsocket>
		</>
	);
}

export default CWebsocketContext;
