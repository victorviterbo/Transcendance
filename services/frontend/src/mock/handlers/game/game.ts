import { http, HttpResponse } from "msw";
import { API_GAME } from "../../../constants";
import type { IGameDataRes } from "../../../types/game";
import {
	mockGetGameData,
	mockClientJoinRoom,
	mockGameAddPlayer,
	type IMockGameData,
} from "./game_db";
import type { TWSSend } from "../../../types/websocket";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

//====================== GETS ======================
export const gameRequestHandler = http.get(API_GAME.replaceAll("{ROOMID}", "123456"), async () => {
	const isError: boolean = false;
	if (isError)
		return HttpResponse.json(
			{
				error: {
					default: [{ message: "Game is disabled", code: "Can't fecth game data" }],
				},
			},
			{ status: isError ? 400 : 200 },
		);
	return HttpResponse.json({ game: mockGetGameData("123456") } as IGameDataRes);
});

//====================== WS ======================
export function mockHandleGameMessages(Data: TWSSend, client: WebSocketClientConnectionProtocol) {
	if (Data.target != "game") return;
	if (Data.event == "join") {
		mockClientJoinRoom(Data.gameid, client);
		mockGameSimulate(Data.gameid);
	}
}

//--------------------- SIMULATION ---------------------
function mockGameSimulate(GameID: string) {
	const data: IMockGameData = mockGetGameData(GameID);
	if (data.isOn) return;
	data.isOn = true;
	for (let i = 0; i < 10; i++) {
		const time: number = Math.random() * 10000 + 1000;
		setTimeout(() => mockGameAddPlayer(GameID), time);
	}
}
