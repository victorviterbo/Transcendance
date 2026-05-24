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

const EMockRoundResolvType: Record<string, number> = {
	NONE: 0,
	ARTIST: 1,
	MUSIC: 2,
	FULL: 3,
};

export const MOCK_JOIN_ROOM = "join";
export const MOCK_HOST_ROOM = "host";
export const MOCK_PLAYING_ROOM = "playing";

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
function mockCreateRounds(Room: IMockGameData) {
	for (let i = 0; i < Room.settings.nbMusic; i++) {
		let points: number = 0;
		let titleFound: number = -1;
		let artistFound: number = -1;

		if (i < Room.status.round) {
			const type: number = Math.trunc(Math.random() * 4);
			if (type == EMockRoundResolvType.ARTIST || type == EMockRoundResolvType.FULL) {
				points += 5;
				artistFound = Math.round(Math.random() * Room.settings.timer - 5);
			}
			if (type == EMockRoundResolvType.MUSIC || type == EMockRoundResolvType.FULL) {
				points += 5;
				titleFound = Math.round(Math.random() * Room.settings.timer - 5);
			}
		}

		if (i == Room.status.round) {
			points += 10;
			artistFound = 5;
			titleFound = 15;
		}

		Room.rounds.push({
			previewLink:
				"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/35/b6/a0/35b6a026-26bc-cfb1-30d3-9c3c1820c63f/mzaf_8281785747956416426.plus.aac.p.m4a",
			titleFound,
			artistFound,
			points,
			time: 0.0,
			phase: i < Room.status.round ? "done" : Room.status.round == i ? "playing" : "not-done",
			answers: [],
		});
	}
}

function mockCreateAnswers(Room: IMockGameData) {
	Room.rounds[Room.status.round].answers.push({
		message: "Joe dassin - coline",
		time: 2.56,
		titleFound: false,
		artistFound: false,
	});

	Room.rounds[Room.status.round].answers.push({
		message: "Gold - laisser moi",
		time: 5,
		titleFound: false,
		artistFound: true,
	});

	Room.rounds[Room.status.round].answers.push({
		message: "Joe dassin - Capitaine abandonné",
		time: 15,
		titleFound: true,
		artistFound: false,
	});

	Room.rounds[Room.status.round].answers.push({
		message: "Gold - Capitaine abandonné",
		time: 20.589,
		titleFound: true,
		artistFound: true,
	});
}

function mockCreateOtherDone(Room: IMockGameData) {
	for (let i = 0; i < 3; i++) {
		Room.players[i].current = {
			lastestTime: 5.25 + 5.1 * i,
			artistFound: i == 0 || i == 2,
			titleFound: i == 0 || i == 1,
		};
	}
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
		status: {
			phase: "waiting",
			round: 0,
			keyTime: 0,
		},
		rounds: [],
		players: [],
		chat: [],
		maxPlayers: 100,
		isHost: GameID == MOCK_HOST_ROOM,
		lastId: 0,
		isOn: false,
	};

	//UNIQUE CONF
	if (GameID == MOCK_JOIN_ROOM) {
		for (nRoom.lastId = 0; nRoom.lastId < 4; nRoom.lastId++) {
			nRoom.players.push({
				points: 0,
				user: mockSocialDB.users[nRoom.lastId],
				host: nRoom.lastId == 0,
				colorid: nRoom.lastId % 10,
				current: {
					lastestTime: -1,
					artistFound: false,
					titleFound: false,
				},
			});

			nRoom.chat.push({
				useruid: mockSocialDB.users[nRoom.lastId].uid,
				username: mockSocialDB.users[nRoom.lastId].username,
				messageuid: crypto.randomUUID(),

				type: "joined",
			});
		}

		mockCreateChat(nRoom);
	} else if (GameID == MOCK_PLAYING_ROOM) {
		for (nRoom.lastId = 0; nRoom.lastId < 15; nRoom.lastId++) {
			nRoom.players.push({
				points: 0,
				user: mockSocialDB.users[nRoom.lastId],
				host: nRoom.lastId == 0,
				colorid: nRoom.lastId % 10,
				current: {
					lastestTime: -1,
					artistFound: false,
					titleFound: false,
				},
			});

			nRoom.chat.push({
				useruid: mockSocialDB.users[nRoom.lastId].uid,
				username: mockSocialDB.users[nRoom.lastId].username,
				messageuid: crypto.randomUUID(),

				type: "joined",
			});
		}

		nRoom.status.phase = "playing_round";
		nRoom.status.round = 5;
		nRoom.status.keyTime = Date.now() - 5 * 1000;

		mockCreateRounds(nRoom);
		mockCreateAnswers(nRoom);
		mockCreateOtherDone(nRoom);
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
		current: {
			lastestTime: -1,
			artistFound: false,
			titleFound: false,
		},
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
