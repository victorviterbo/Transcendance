import { debugLog } from "../../../utils/debug";
import { ws } from "msw";
import { WS_ADDRESS_WMS } from "../../../constants";
import type { IWSGameRCVEvent, TWSRcv, TWSSend } from "../../../types/websocket";
import { mockMessagesFriend1Update, onMessageSent, onMessageStatus } from "../social/socialChat";
import { mockAcceptingRequests, mockNewIncomingRequests } from "../social/social";
import { mockHandleGameMessages } from "../game/mockGameHandlers";

//--------------------------------------------------
//                                    NAME
//--------------------------------------------------
const socket = ws.link(WS_ADDRESS_WMS);

export let mockNoRequests: boolean = false;
export const mockSetNoRequests = (value: boolean) => {
	mockNoRequests = value;
};

const closeTest: boolean = false;
let closeCount: number = 0;

export const socketConnHandler = socket.addEventListener("connection", ({ client }) => {
	//====================== DATA ======================
	let counter = 0;

	//====================== EXEC ======================
	debugLog("[MOCK] Client connected: " + client.id);

	if (closeTest && closeCount < 3) {
		client.close();
		closeCount++;
	}
	client.addEventListener("message", (event) => {
		const dataRcv: TWSSend | IWSGameRCVEvent =
			typeof event.data == "string" ? JSON.parse(event.data) : event.data;
		if (dataRcv.target == "test_counter_event") {
			counter++;
			const sendbackList: TWSRcv = {
				target: "test_counter",
				count: counter,
			};
			client.send(JSON.stringify(sendbackList));
		} else if (dataRcv.target == "friend_chat") {
			if (dataRcv.event == "send") onMessageSent(dataRcv, client);
			else if (dataRcv.event == "open") onMessageStatus(dataRcv);
			else if (dataRcv.event == "close") onMessageStatus(dataRcv);
		} else if (dataRcv.target == "game") {
			mockHandleGameMessages(dataRcv as IWSGameRCVEvent, client);
		}
	});

	mockMessagesFriend1Update(client);
	if (!mockNoRequests) {
		mockNewIncomingRequests(client);
		mockAcceptingRequests(client);
	}
});
