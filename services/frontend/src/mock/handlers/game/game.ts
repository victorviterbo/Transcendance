import { http, HttpResponse } from "msw";
import { API_GAME } from "../../../constants";
import type { IGameDataRes, IGamePlayer } from "../../../types/game";
import {
	mockGetGameData,
	mockClientJoinRoom,
	mockGameAddPlayer,
	type IMockGameData,
	mockPlayerLeaveRoom,
	mockGameUserSentChatMessage,
	mockGetGamePlayer,
	mockPlayerSendMessage,
	MOCK_JOIN_ROOM,
	MOCK_HOST_ROOM,
	mockOnUserChangedSettings,
	MOCK_PLAYING_ROOM,
} from "./game_db";
import type { TWSSend } from "../../../types/websocket";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";
import { mockSocialDB } from "../social/social_dbs";

export let mockGameError: boolean = false;
export const mockSetGameError = (value: boolean) => {
	mockGameError = value;
};

//====================== GETS ======================
export const gameRequestHandlerJoin = http.get(
	API_GAME.replaceAll("{ROOMID}", MOCK_JOIN_ROOM),
	async () => {
		if (mockGameError)
			return HttpResponse.json(
				{
					error: {
						default: [{ message: "Game is disabled", code: "GAME_ERROR_GLOBAL" }],
					},
				},
				{ status: mockGameError ? 400 : 200 },
			);
		return HttpResponse.json({ game: mockGetGameData(MOCK_JOIN_ROOM) } as IGameDataRes);
	},
);
export const gameRequestHandlerHost = http.get(
	API_GAME.replaceAll("{ROOMID}", MOCK_HOST_ROOM),
	async () => {
		if (mockGameError)
			return HttpResponse.json(
				{
					error: {
						default: [{ message: "Game is disabled", code: "GAME_ERROR_GLOBAL" }],
					},
				},
				{ status: mockGameError ? 400 : 200 },
			);
		return HttpResponse.json({ game: mockGetGameData(MOCK_HOST_ROOM) } as IGameDataRes);
	},
);
export const gameRequestHandlerPlaying = http.get(
	API_GAME.replaceAll("{ROOMID}", MOCK_PLAYING_ROOM),
	async () => {
		if (mockGameError)
			return HttpResponse.json(
				{
					error: {
						default: [{ message: "Game is disabled", code: "GAME_ERROR_GLOBAL" }],
					},
				},
				{ status: mockGameError ? 400 : 200 },
			);
		return HttpResponse.json({ game: mockGetGameData(MOCK_PLAYING_ROOM) } as IGameDataRes);
	},
);

//====================== WS ======================
export function mockHandleGameMessages(Data: TWSSend, client: WebSocketClientConnectionProtocol) {
	if (Data.target != "game") return;
	if (Data.event == "join") {
		mockClientJoinRoom(Data.gameid, client);
		mockGameSimulate(Data.gameid);
	}
	if (Data.event == "message-send") {
		mockGameUserSentChatMessage(Data.gameid, Data.message);
	}
	if (Data.event == "settings-update") {
		mockOnUserChangedSettings(Data.gameid, Data.settings);
	}
}

//--------------------- SIMULATION ---------------------
function mockGameSimulate(GameID: string) {
	if (GameID == MOCK_JOIN_ROOM) mockGameSimulateJoin(GameID);
	else if (GameID == MOCK_HOST_ROOM) mockGameSimulateHost(GameID);
	else if (GameID == MOCK_PLAYING_ROOM) mockGameSimulatePlaying(GameID);
}
function mockGameSimulateJoin(GameID: string) {
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

			if (lastID == 4) {
				const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
					GameID,
					mockSocialDB.users[lastID].uid,
				);
				if (localPlayer)
					setTimeout(
						() => mockPlayerSendMessage(GameID, localPlayer, "message", "Hey !!!"),
						1000,
					);
			}
			if (lastID == 5) {
				const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
					GameID,
					mockSocialDB.users[lastID].uid,
				);
				if (localPlayer)
					setTimeout(
						() =>
							mockPlayerSendMessage(GameID, localPlayer, "message", "Hello everyone"),
						1500,
					);
			}
			if (lastID == 9) {
				const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
					GameID,
					mockSocialDB.users[lastID].uid,
				);
				if (localPlayer)
					setTimeout(
						() =>
							mockPlayerSendMessage(
								GameID,
								localPlayer,
								"message",
								"Is everyone ready ?",
							),
						750,
					);
			}
		}, time);
	}

	setTimeout(() => {
		data.settings.tags["TAG_RNB"] = true;
		mockOnUserChangedSettings(GameID, {
			tags: data.settings.tags,
			nbMusic: 40,
			timer: 15,
			breakTimer: 5,
			seeOthers: false,
			fuzzy: true,
			scoreOption: "normal",
			scope: "public",
			code: data.settings.code,
		});
	}, 5000);
}

function mockGameSimulateHost(GameID: string) {
	const data: IMockGameData = mockGetGameData(GameID);
	if (data.isOn) return;
	data.isOn = true;
	for (let i = 0; i < 13; i++) {
		const time: number = Math.random() * 6000 + 1000;
		setTimeout(() => {
			mockGameAddPlayer(GameID);
			const lastID = data.lastId - 1;

			if (lastID == 4) {
				const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
					GameID,
					mockSocialDB.users[lastID].uid,
				);
				if (localPlayer)
					setTimeout(
						() => mockPlayerSendMessage(GameID, localPlayer, "message", "Hey !!!"),
						1000,
					);
			}
			if (lastID == 5) {
				const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
					GameID,
					mockSocialDB.users[lastID].uid,
				);
				if (localPlayer)
					setTimeout(
						() =>
							mockPlayerSendMessage(GameID, localPlayer, "message", "Hello everyone"),
						1500,
					);
			}
			if (lastID == 9) {
				const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
					GameID,
					mockSocialDB.users[lastID].uid,
				);
				if (localPlayer)
					setTimeout(
						() =>
							mockPlayerSendMessage(
								GameID,
								localPlayer,
								"message",
								"Is everyone ready ?",
							),
						750,
					);
			}
		}, time);
	}
}

function mockGameSimulatePlaying(GameID: string) {
	const data: IMockGameData = mockGetGameData(GameID);
	if (data.isOn) return;
	data.isOn = true;
}
