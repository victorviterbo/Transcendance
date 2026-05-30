import { green } from "@mui/material/colors";
import type { IGamePlayer, IGameSettings, IGameStatus, IGameUser, TGameVisibility } from "../../../types/game";
import { convExtUserToGameUser, type IExtUserInfo } from "../../../types/user";
import type { IWSGameEventSndList, IWSGameRCVEvent, IWSGameSendEvent, IWSGameSendEventGameInfo, IWSGameSendEventPlayerJoined } from "../../../types/websocket";
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
		this.buildPlayers();
		this.simulate();
	}
	buildPlayers() {

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

		//--------------------- PLAYERS ---------------------
	players: IGamePlayer[] = [];
	

		//--------------------- SETTINGS ---------------------
	settings: IGameSettings = mockGameDB.getDefaultSettings();
	
		//--------------------- MOCK ---------------------
	currentTarget: number = 0;
	simStarted: boolean = false;


	//====================== EVENTS ======================
	onJoin()
	{
		this.log("User has join");
		this.log("Sending to new user all game info");
		const gameInfo: IWSGameSendEventGameInfo = {
			...this.getBaseData("game_info"),
			event: "game_info",
			game: {
				uid: this.uid,
				name: this.name,
				owner: convExtUserToGameUser(this.host, false),
				status: this.status.phase,
				round: this.status.round,
				visibility: this.visibility,
				maxPlayers: 20,
			},
			settings: this.settings,
			leaderboard: this.players,
		}
		this.sendEvent(gameInfo as IWSGameSendEvent)

		this.log("Adding user to player list");
		this.joinPlayer(mockGameDB.getSelf())
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
			self: mockGameDB.getSelf()
		}
	}

		//--------------------- Manage ---------------------
	joinPlayer(user: IGameUser) {

		
		this.log("Player: '" + user.username + "' has joined");
		this.players.push({
			user,
			points: 0,
		});

		const event: IWSGameSendEventPlayerJoined = {
			...this.getBaseData("player_joined"),
			event: "player_joined",
			player:this.players[this.players.length - 1]
		}
		this.sendEvent(event as IWSGameSendEvent)
	}

		//--------------------- Simulate ---------------------
	simulate(): void  {
		this.simStarted = true;
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
	buildPlayers(): void {
		super.buildPlayers();
		for(; this.currentTarget < 4; this.currentTarget++ )
		{
			this.players.push({
				user: convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				points: 0
			})
		}
	}


	//====================== FUNCTIONS ======================
		//--------------------- Simulate ---------------------
	simulate(): void  {
		if(this.simStarted)
			return;
		super.simulate();

		for (let i = 0; i < 15; i++) {
			const time: number = Math.random() * 6000 + 1000;
			setTimeout(() => {
				this.joinPlayer(convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false));
				const lastID = this.currentTarget;
				this.currentTarget++;

				// if (lastID == 6 || lastID == 9) {
				// 	setTimeout(() => mockPlayerLeaveRoom(GameID, mockSocialDB.users[lastID].uid), 6500);
				// } else if (lastID == 11) {
				// 	setTimeout(
				// 		() => mockPlayerLeaveRoom(GameID, mockSocialDB.users[lastID].uid, true),
				// 		6500,
				// 	);
				// }

				// if (lastID == 4) {
				// 	const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
				// 		GameID,
				// 		mockSocialDB.users[lastID].uid,
				// 	);
				// 	if (localPlayer)
				// 		setTimeout(
				// 			() => mockPlayerSendMessage(GameID, localPlayer, "message", "Hey !!!"),
				// 			1000,
				// 		);
				// }
				// if (lastID == 5) {
				// 	const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
				// 		GameID,
				// 		mockSocialDB.users[lastID].uid,
				// 	);
				// 	if (localPlayer)
				// 		setTimeout(
				// 			() =>
				// 				mockPlayerSendMessage(GameID, localPlayer, "message", "Hello everyone"),
				// 			1500,
				// 		);
				// }
				// if (lastID == 9) {
				// 	const localPlayer: IGamePlayer | undefined = mockGetGamePlayer(
				// 		GameID,
				// 		mockSocialDB.users[lastID].uid,
				// 	);
				// 	if (localPlayer)
				// 		setTimeout(
				// 			() =>
				// 				mockPlayerSendMessage(
				// 					GameID,
				// 					localPlayer,
				// 					"message",
				// 					"Is everyone ready ?",
				// 				),
				// 			750,
				// 		);
				// }
			}, time);
		}
	}

}