import type { IGameSettings, IGameStatus, TGameVisibility } from "../../../types/game";
import { convExtUserToGameUser, type IExtUserInfo } from "../../../types/user";
import type { IWSGameEventSndList, IWSGameRCVEvent, IWSGameSendEvent, IWSGameSendEventGameInfo } from "../../../types/websocket";
import { mockDefaultPP, mockDefaultUsername, mockDefaultUserUID } from "../../db";
import { mockSocialDB } from "../social/social_dbs";
import { mockGameDB } from "./game_db";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

export function mockHandleGameMessages(Data: IWSGameRCVEvent, client: WebSocketClientConnectionProtocol) {
	if (Data.target != "game") return;
	mockGameDB.client = client;

	const eventGame: MockGame = mockGameDB.getGame(Data.uid);
	eventGame.rcvEvent(Data);
}



export class MockGame {


	//====================== CONSTRUCTOR ======================
	constructor(uid: string, host?: IExtUserInfo) {
		this.uid = uid
		this.log("Game: '" + uid + "' created");
		if(host)
			this.host = host;
		else
			this.host = mockGameDB.getDefaultHost();
	}

	//====================== DATA ======================
		//--------------------- INFOS ---------------------
	uid: string;
	name: string = "Random room";
	host: IExtUserInfo;
	visibility: TGameVisibility = "public";

		//--------------------- STATUS ---------------------
	status: IGameStatus = {
		phase: "waiting",
		round: 0,
		keyTime: 0,
	}

		//--------------------- SETTINGS ---------------------
	settings: IGameSettings = mockGameDB.getDefaultSettings();



	//====================== EVENTS ======================
	onJoin()
	{
		this.log("User has join");
		this.log("Sending to new user all game info");
		const gameInfo: IWSGameSendEventGameInfo = {
			game: {
				uid: this.uid,
				name: this.name,
				owner: convExtUserToGameUser(this.host, false),
				status: this.status.phase,
				round: this.status.round,
				visibility: this.visibility,
			},
			settings: this.settings,
			...this.getBaseData("game_info"),
		}
		this.sendEvent(gameInfo as unknown as IWSGameSendEvent)
	}

	//====================== FUNCTIONS ======================
		//--------------------- WS ---------------------
	rcvEvent(e: IWSGameRCVEvent) {
		if(e.event == "game_join")
			this.onJoin();
	}
	sendEvent(data: IWSGameSendEvent) {
		if(!mockGameDB.client)
			return;
		mockGameDB.client.send(JSON.stringify(data));
	}
	getBaseData(event: IWSGameEventSndList): IWSGameSendEvent {
		return {
			target: "game",
			event,
			uid: this.uid,
			self: {
				username: mockDefaultUsername,
				avatar: mockDefaultPP,
				guest: false,
				uid: mockDefaultUserUID,
			}
		}
	}
	
		//--------------------- LOGs ---------------------
	log(MSG: string, ...Styling: string[]){
		console.log("[%cMOCK-GAME%c]: " + MSG, "font-weight: 900; color: #ca15e2", "font-weight: 400; color: white", ...Styling);
	}	

}


//--------------------------------------------------
//                     PLAYING
//--------------------------------------------------
export class MockGamePlaying extends MockGame {


	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid);
		this.name = "Active game room"
		this.log("Game (Playing): '" + uid + "' created");
	}

	//====================== DATA ======================

}


//--------------------------------------------------
//                     HOSTING
//--------------------------------------------------
export class MockGameHosting extends MockGame {


	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid);
		this.name = "John's room"
		this.log("Game (Hosting): '" + uid + "' created");
	}

	//====================== DATA ======================

}


//--------------------------------------------------
//                     JOINING
//--------------------------------------------------
export class MockGameJoining extends MockGame {


	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid, mockSocialDB.users[0]);
		this.name = "Sarah's room"
		this.log("Game (Joining): '" + uid + "' created");
	}

	//====================== DATA ======================

}