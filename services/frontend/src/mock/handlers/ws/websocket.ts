import { ws } from "msw";
import { WS_ADRESS } from "../../../constants";
import type { TWebsocketRcv } from "../../../types/websocket";

const socket = ws.link(WS_ADRESS);

export const socketConnHandler = socket.addEventListener("connection", ({ client }) => {
	let count = 1;

	setInterval(() => {
		count++;

		if (Math.round(Math.random()) == 0) {
			const sendback: TWebsocketRcv = {
				target: "chat",
				count: count,
			};
			client.send(JSON.stringify(sendback));
		} else {
			const sendbackList: TWebsocketRcv = {
				target: "list",
				info: "hello",
			};
			client.send(JSON.stringify(sendbackList));
		}
	}, 2000);
});
