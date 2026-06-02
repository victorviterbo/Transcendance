import type { IGameSettings, IGameUser } from "../../../types/game";
import type { IExtUserInfo } from "../../../types/user";
import { mockDefaultPP, mockDefaultUsername, mockDefaultUserUID } from "../../db";
import { mockSocialSetDB } from "../social/social_dbs";
import { MockGame, MockGameHosting, MockGameJoining, MockGamePlaying } from "./mockGameHandlers";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

export class MockGameDB {

	//====================== CONSTRUCTOR ======================
	constructor() {
		mockSocialSetDB();
	}

	//====================== DATA ======================
	games: MockGame[] = [];
	client: WebSocketClientConnectionProtocol | undefined;

	//====================== FUNCTIONS ======================
	createGame(uid: string): MockGame {
		let game: MockGame | undefined = this.games.find((gameSearch: MockGame) => {
			return gameSearch.uid == uid;
		})
		if(!game)
		{
			switch(uid)
			{
				case "host":
					game = new MockGameHosting(uid);
					break;
				case "join":
					game = new MockGameJoining(uid);
					break;
				case "playing":
					game = new MockGamePlaying(uid);
					break;
				default:
					game = new MockGame(uid);
					break;
			}
			this.games.push(game);
		}
		return game;
	}
	getGame(uid: string): MockGame {
		const game: MockGame | undefined = this.games.find((gameSearch: MockGame) => {
			return gameSearch.uid == uid;
		})
		if(!game)
			return this.createGame(uid);
		return game;
	}


	//====================== DEFAULT ======================
	getDefaultHost(): IExtUserInfo {
		return  {
			uid: mockDefaultUserUID,
			username: mockDefaultUsername,
			image: mockDefaultPP,
		
			badges: "",
			relation: "self",
		}
	}
	getSelf(): IGameUser {
		return  {
			uid: mockDefaultUserUID,
			username: mockDefaultUsername,
			avatar: mockDefaultPP,
			guest: false
		}
	}

	getDefaultSettings(): IGameSettings {
		return  {
			genres: ["TAG_POP", "TAG_RAP"],
			mode: "speed",
			trackCount: 15,
			playbackDuration: 30,
			breakDuration: 15,
			reveal: true,
			fuzzy: true,
		}
	}
}

export const mockGameDB = new  MockGameDB();