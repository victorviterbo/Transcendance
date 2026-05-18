import type {
	IGameChatMsg,
	IGameData,
	IGamePlayer,
	IGameSettings,
	TGameChatType,
} from "../../../types/game";
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
import { MUSIC_TAGS } from "../../../constants";

export interface IMockGameData extends IGameData {
	lastId: number;
	isOn: boolean;
}

export const MOCK_JOIN_ROOM = "123456";
export const MOCK_HOST_ROOM = "789";

//====================== DATA ======================
let currentClient: WebSocketClientConnectionProtocol | undefined = undefined;
let mockGameData: Record<string, IMockGameData> = {};

//--------------------------------------------------
//                      MANAGE
//--------------------------------------------------
function mockCreateChat(Room: IMockGameData) {
	Room.chat.push({
		useruid: mockSocialDB.users[0].uid,
		username: mockSocialDB.users[0].username,
		messageuid: crypto.randomUUID(),

		type: "message",
		message: "Hello everyone how are ?",
	});

	Room.chat.push({
		useruid: mockSocialDB.users[1].uid,
		username: mockSocialDB.users[1].username,
		messageuid: crypto.randomUUID(),

		type: "message",
		message: "Hey",
	});

	Room.chat.push({
		useruid: mockSocialDB.users[0].uid,
		username: mockSocialDB.users[0].username,
		messageuid: crypto.randomUUID(),

		type: "message",
		message: "Hey !!",
	});

	Room.chat.push({
		useruid: mockSocialDB.users[1].uid,
		username: mockSocialDB.users[1].username,
		messageuid: crypto.randomUUID(),

		type: "message",
		message:
			"sloubi 1 sloubi 2 sloubi 3 sloubi 4 sloubi 5 sloubi 6 sloubi 7 sloubi 8 sloubi 9 sloubi 10 sloubi 11 sloubi 12 sloubi 13 sloubi 14 sloubi 15 sloubi 16 sloubi 17 sloubi 18 sloubi 19 sloubi 20",
	});

	Room.chat.push({
		useruid: mockSocialDB.users[0].uid,
		username: mockSocialDB.users[0].username,
		messageuid: crypto.randomUUID(),

		type: "message",
		message: "TG",
	});

	Room.chat.push({
		useruid: mockSocialDB.users[0].uid,
		username: mockSocialDB.users[0].username,
		messageuid: crypto.randomUUID(),

		type: "guessed",
		message: "o zone dragostea din tei",
	});

	Room.chat.push({
		useruid: mockSocialDB.users[0].uid,
		username: mockSocialDB.users[0].username,
		messageuid: crypto.randomUUID(),

		type: "found",
	});
}
export function mockCreateRoom(GameID: string) {
	mockSocialSetDB();

	//Tags
	const tags: Record<string, boolean> = {};
	MUSIC_TAGS.forEach((tag: string, index: number) => {
		tags[tag] = index < 2;
	});

	const nRoom: IMockGameData = {
		id: GameID,
		uid: crypto.randomUUID(),
		name: GameID == MOCK_HOST_ROOM ? "John's own room" : "Sarah's room",
		settings: {
			tags: tags,
			nbMusic: 20,
			timer: 30,
			breakTimer: 15,
			seeOthers: true,
			fuzzy: true,
			scoreOption: "speed",
			scope: "public",
			code: "qwertyuiop",
		},
		players: [],
		chat: [],
		maxPlayers: 100,
		isHost: GameID == MOCK_HOST_ROOM,
		lastId: 0,
		isOn: false,
	};

	//Adding already presents players
	if (GameID == MOCK_JOIN_ROOM) {
		for (nRoom.lastId = 0; nRoom.lastId < 4; nRoom.lastId++) {
			nRoom.players.push({
				points: 0,
				user: mockSocialDB.users[nRoom.lastId],
				host: nRoom.lastId == 0,
				colorid: nRoom.lastId % 10,
			});

			nRoom.chat.push({
				useruid: mockSocialDB.users[nRoom.lastId].uid,
				username: mockSocialDB.users[nRoom.lastId].username,
				messageuid: crypto.randomUUID(),

				type: "joined",
			});
		}

		mockCreateChat(nRoom);
	}

	mockGameData[GameID] = nRoom;
	return nRoom;
}

export function mockGetGameData(GameID: string): IMockGameData {
	if (!mockGameData[GameID]) mockCreateRoom(GameID);
	return mockGameData[GameID];
}

export function mockResetGames() {
	mockGameData = {};
}

export function mockGetGameSelf(GameID: string): IGamePlayer | undefined {
	const data: IMockGameData = mockGetGameData(GameID);
	return data.players.find((player: IGamePlayer) => player.user.uid == mockDefaultUserUID);
}

export function mockGetGamePlayer(GameID: string, PlayerUID: string): IGamePlayer | undefined {
	const data: IMockGameData = mockGetGameData(GameID);
	return data.players.find((player: IGamePlayer) => player.user.uid == PlayerUID);
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
		host: GameID == MOCK_HOST_ROOM && User.username == mockDefaultUsername,
		colorid: data.lastId % 10,
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
			gameid: GameID,
			gameuid: data.uid,
		} as TWSRcv),
	);
	mockPlayerSendMessage(GameID, data.players[data.players.length - 1], "joined");
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
				gameid: GameID,
				gameuid: data.uid,
			} as TWSRcv),
		);
		mockPlayerSendMessage(GameID, player[0], "leaved", undefined, true);
		return;
	}
	currentClient.send(
		JSON.stringify({
			target: "game",
			event: "player-leave",
			player: player[0],
			gameid: GameID,
			gameuid: data.uid,
		} as TWSRcv),
	);
	mockPlayerSendMessage(GameID, player[0], "leaved");
}

//--------------------------------------------------
//                 MESSAGE MANAGEMENT
//--------------------------------------------------
export function mockPlayerSendMessage(
	GameID: string,
	Target: IGamePlayer,
	Type: TGameChatType,
	Message?: string,
	Update: boolean = false,
) {
	const data: IMockGameData = mockGetGameData(GameID);
	const nMessage: IGameChatMsg = {
		useruid: Target.user.uid,
		username: Target.user.username,
		messageuid: crypto.randomUUID(),

		type: Type,
		message: Message,
	};
	data.chat.push(nMessage);
	if (!currentClient) return;
	if (Update) {
		currentClient.send(
			JSON.stringify({
				target: "game",
				event: "message-update",
				messages: data.chat,
				gameid: GameID,
				gameuid: data.uid,
			} as TWSRcv),
		);
		return;
	}
	currentClient.send(
		JSON.stringify({
			target: "game",
			event: "message-new",
			message: nMessage,
			gameid: GameID,
			gameuid: data.uid,
		} as TWSRcv),
	);
}

export function mockGameUserSentChatMessage(GameID: string, Message: string) {
	const selfUser: IGamePlayer | undefined = mockGetGameSelf(GameID);
	if (!selfUser) return;
	mockPlayerSendMessage(GameID, selfUser, "message", Message);
}

//--------------------------------------------------
//                SETTINGS MANAGEMENT
//--------------------------------------------------
export function mockOnUserChangedSettings(GameID: string, Settings: IGameSettings) {
	const data: IMockGameData = mockGetGameData(GameID);
	data.settings = Settings;

	if (!currentClient) return;
	currentClient.send(
		JSON.stringify({
			target: "game",
			event: "settings-update",
			settings: Settings,
			gameid: GameID,
			gameuid: data.uid,
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
