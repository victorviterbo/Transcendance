import { http, HttpResponse } from "msw";
import { API_GAME } from "../../../constants";
import type { IGameDataRes } from "../../../types/game";
import {
	mockGetGameData,
	mockClientJoinRoom,
	mockGameAddPlayer,
	type IMockGameData,
	mockPlayerLeaveRoom,
	mockGameUserSentChatMessage,
} from "./game_db";
import type { TWSSend } from "../../../types/websocket";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";
import { mockSocialDB } from "../social/social_dbs";

export let mockGameError: boolean = false;
export const mockSetGameError = (value: boolean) => {
	mockGameError = value;
};

//====================== GETS ======================
export const gameRequestHandler = http.get(API_GAME.replaceAll("{ROOMID}", "123456"), async () => {
	if (mockGameError)
		return HttpResponse.json(
			{
				error: {
					default: [{ message: "Game is disabled", code: "GAME_ERROR_GLOBAL" }],
				},
			},
			{ status: mockGameError ? 400 : 200 },
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
	if (Data.event == "message-send") {
		mockGameUserSentChatMessage(Data.gameid, Data.message)
	}
}

//--------------------- SIMULATION ---------------------
function mockGameSimulate(GameID: string) {
	const data: IMockGameData = mockGetGameData(GameID);
	if (data.isOn) return;
	data.isOn = true;
	for (let i = 0; i < 15; i++) {
		const time: number = Math.random() * 6000 + 1000;
		setTimeout(() => {
			mockGameAddPlayer(GameID);
			const lastID = data.lastId - 1;

			if (lastID == 6 || lastID == 9) {
				setTimeout(() => mockPlayerLeaveRoom(GameID, mockSocialDB.users[lastID].uid), 6500);
			} else if (lastID == 11) {
				setTimeout(
					() => mockPlayerLeaveRoom(GameID, mockSocialDB.users[lastID].uid, true),
					6500,
				);
			}
		}, time);
	}
}
