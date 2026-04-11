import { ws } from "msw";
import { WS_ADRESS } from "../../../constants";
import type { TWSRcv } from "../../../types/websocket";
import { mockMessagesFriend1Update, onMessageSent } from "../social/socialChat";

//--------------------------------------------------
//                                    NAME
//--------------------------------------------------
const socket = ws.link(WS_ADRESS);

export const socketConnHandler = socket.addEventListener("connection", ({ client }) => {
	//====================== DATA ======================
	let counter = 0;

	//====================== EXEC ======================
	console.log("[MOCK] Client connected: " + client.id);

	client.addEventListener("message", (event) => {
		const dataRcv: TWSRcv = typeof event.data == "string" ? JSON.parse(event.data) : event.data;
		if (dataRcv.target == "test_counter_event") {
			counter++;
			const sendbackList: TWSRcv = {
				target: "test_counter",
				count: counter,
			};
			client.send(JSON.stringify(sendbackList));
		} else if (dataRcv.target == "friend-chat")
			if (dataRcv.event == "send") onMessageSent(dataRcv, client);
	});

	mockMessagesFriend1Update(client);
});
