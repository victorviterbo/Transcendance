import type { IGameSettings, IGameTrack, IGameUser } from "../../../types/game";
import type { IExtUserInfo } from "../../../types/user";
import { mockDefaultPP, mockDefaultUsername, mockDefaultUserUID } from "../../db";
import { mockSocialSetDB } from "../social/social_dbs";
import { MockGame, MockGameHosting, MockGameJoining, MockGamePlaying } from "./mockGameHandlers";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

// https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/49/91/bb/4991bbbc-300b-f07d-71e1-096f1db7b667/mzaf_6226001835790259080.plus.aac.p.m4a


export class MockGameDB {

	//====================== CONSTRUCTOR ======================
	constructor() {
		mockSocialSetDB();
	}

	//====================== DATA ======================
	games: MockGame[] = [];
	client: WebSocketClientConnectionProtocol | undefined;

	mockTracks: IGameTrack[] = [
	{
		title: "The Way I Are",
		artist: "Timbaland",
		preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9f/80/22/9f80221e-50ec-b690-a6c7-561e73901ccf/mzaf_17739549421108413963.plus.aac.p.m4a",
		artwork: "/temp/temp01.jpg",
	},
	{
		title: "C'est ma life",
		artist: "Soprano",
		preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/07/18/dc/0718dc36-8c91-3a55-5e9d-c809926df677/mzaf_8339858598668446093.plus.aac.p.m4a",
		artwork: "/temp/temp02.jpg",
	},
	{
		title: "Morenas",
		artist: "Lord Kossity",
		preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/42/e1/77/42e17719-bd48-ae1f-0541-e82589eefc3d/mzaf_15893395910114083994.plus.aac.p.m4a",
		artwork: "/temp/temp03.jpg",
	},
	{
		title: "Milkshake",
		artist: "Kelis",
		preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/27/9d/e9/279de9d5-873c-0285-7e16-bbb534be72df/mzaf_1701884203441386212.plus.aac.p.m4a",
		artwork: "",
	},
	{
		title: "Donnez Nous De La Funk",
		artist: "DJ Abdel",
		preview: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/49/91/bb/4991bbbc-300b-f07d-71e1-096f1db7b667/mzaf_6226001835790259080.plus.aac.p.m4a",
		artwork: "",
	}
]


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
	getRoundTrack(id: number){
		return this.mockTracks[id % this.mockTracks.length];
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