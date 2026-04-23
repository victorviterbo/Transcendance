import { ws } from "msw";
import { WS_ADRESS_WMS } from "../../../constants";
import type { TWSRcv, TWSSend } from "../../../types/websocket";
import { mockMessagesFriend1Update, onMessageSent, onMessageStatus } from "../social/socialChat";
import { mockAcceptingRequests, mockNewIncomingRequests } from "../social/social";

//--------------------------------------------------
//                                    NAME
//--------------------------------------------------
const socket = ws.link(WS_ADRESS_WMS);

export let mockNoRequests: boolean = false;
export const mockSetNoRequests = (value: boolean) => {
	mockNoRequests = value;
};

export const socketConnHandler = socket.addEventListener("connection", ({ client }) => {
	//====================== DATA ======================
	let counter = 0;

	//====================== EXEC ======================
	console.log("[MOCK] Client connected: " + client.id);

	client.addEventListener("message", (event) => {
		const dataRcv: TWSSend =
			typeof event.data == "string" ? JSON.parse(event.data) : event.data;
		if (dataRcv.target == "test_counter_event") {
			counter++;
			const sendbackList: TWSRcv = {
				target: "test_counter",
				count: counter,
			};
			client.send(JSON.stringify(sendbackList));
		} else if (dataRcv.target == "friend-chat") {
			if (dataRcv.event == "send") onMessageSent(dataRcv, client);
			else if (dataRcv.event == "open") onMessageStatus(dataRcv);
			else if (dataRcv.event == "close") onMessageStatus(dataRcv);
		}
	});

	mockMessagesFriend1Update(client);
	if (!mockNoRequests) {
		mockNewIncomingRequests(client);
		mockAcceptingRequests(client);
	}
});
