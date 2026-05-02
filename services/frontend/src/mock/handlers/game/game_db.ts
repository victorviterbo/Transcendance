import type { IGameData, IGamePlayer } from "../../../types/game";
import { mockSocialDB, mockSocialSetDB } from "../social/social_dbs";
import { mockBadgeStrings, mockDefaultPP, mockDefaultUserUID, mockDefaultUsername } from "../../db";
import type { IExtUserInfo } from "../../../types/user";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";
import type { TWSRcv } from "../../../types/websocket";
import {
	MOCK_COLOR_CYAN_B,
	MOCK_COLOR_GREEN_B,
	MOCK_COLOR_NORMAL,
	MOCK_COLOR_RED_B,
} from "../styling";

export interface IMockGameData extends IGameData {
	lastId: number;
	isOn: boolean;
}

//====================== DATA ======================
let currentClient: WebSocketClientConnectionProtocol | undefined = undefined;
const mockGameData: Record<string, IMockGameData> = {};

//--------------------------------------------------
//                      MANAGE
//--------------------------------------------------
export function mockCreateRoom(GameID: string) {
	mockSocialSetDB();

	const nRoom: IMockGameData = {
		players: [],
		maxPlayers: 100,
		lastId: 0,
		isOn: false,
	};

	//Adding already presents players
	for (nRoom.lastId = 0; nRoom.lastId < 4; nRoom.lastId++) {
		nRoom.players.push({
			points: 0,
			user: mockSocialDB.users[nRoom.lastId],
		});
	}

	mockGameData[GameID] = nRoom;
	return nRoom;
}

export function mockGetGameData(GameID: string): IMockGameData {
	if (!mockGameData[GameID]) mockCreateRoom(GameID);
	return mockGameData[GameID];
}

//--------------------------------------------------
//                    PLAYER MANAGEMENT
//--------------------------------------------------
export function mockGameAddPlayer(GameID: string) {
	const data: IMockGameData = mockGetGameData(GameID);
	mockPlayerJoinRoom(GameID, mockSocialDB.users[data.lastId]);
	data.lastId++;
}

export function mockPlayerJoinRoom(GameID: string, User: IExtUserInfo) {
	const data: IMockGameData = mockGetGameData(GameID);
	if (
		data.players.find((player: IGamePlayer) => {
			return player.user.uid == User.uid;
		})
	)
		return;

	data.players.push({
		points: 0,
		user: User,
	});

	console.log(
		"[mock] Player %c" + User.username + "%c has joined the game %c" + GameID + "%c",
		MOCK_COLOR_CYAN_B,
		MOCK_COLOR_NORMAL,
		MOCK_COLOR_GREEN_B,
		MOCK_COLOR_NORMAL,
	);

	if (!currentClient) return;
	currentClient.send(
		JSON.stringify({
			target: "game",
			event: "player-join",
			player: data.players[data.players.length - 1],
		} as TWSRcv),
	);
}

export function mockPlayerLeaveRoom(GameID: string, ID: string, Update: boolean = false) {
	const data: IMockGameData = mockGetGameData(GameID);
	const pos: number = data.players.findIndex((player: IGamePlayer) => {
		return player.user.uid == ID;
	});
	if (pos == -1) return;

	const player: IGamePlayer[] = data.players.splice(pos, 1);
	if (player.length == 0) return;

	console.log(
		"[mock] Player %c" +
			player[0].user.username +
			"%c has leaved the game %c" +
			GameID +
			"%c" +
			(Update ? " (Update requested)" : ""),
		MOCK_COLOR_RED_B,
		MOCK_COLOR_NORMAL,
		MOCK_COLOR_GREEN_B,
		MOCK_COLOR_NORMAL,
	);

	if (!currentClient) return;
	if (Update) {
		currentClient.send(
			JSON.stringify({
				target: "game",
				event: "players-update",
				players: data.players,
			} as TWSRcv),
		);
		return;
	}
	currentClient.send(
		JSON.stringify({
			target: "game",
			event: "player-leave",
			player: player[0],
		} as TWSRcv),
	);
}

//--------------------------------------------------
//                      EVENT
//--------------------------------------------------
export function mockClientJoinRoom(GameID: string, client: WebSocketClientConnectionProtocol) {
	const data: IMockGameData = mockGetGameData(GameID);
	currentClient = client;
	if (
		!data.players.find((player: IGamePlayer) => {
			return player.user.uid == mockDefaultUserUID;
		})
	) {
		mockPlayerJoinRoom(GameID, {
			uid: mockDefaultUserUID,
			username: mockDefaultUsername,
			image: mockDefaultPP,

			badges: mockBadgeStrings[0],
			relation: "self",
		});
	}
}
