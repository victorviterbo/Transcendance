import type { IGameData, IGamePlayer } from "../../../types/game";
import { mockSocialDB, mockSocialSetDB } from "../social/social_dbs";
import { mockBadgeStrings, mockDefaultPP, mockDefaultUserUID, mockDefaultUsername } from "../../db";
import type { IExtUserInfo } from "../../../types/user";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";
import type { TWSRcv } from "../../../types/websocket";

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

	if (!currentClient) return;
	currentClient.send(
		JSON.stringify({
			target: "game",
			event: "player-join",
			player: data.players[data.players.length - 1],
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
