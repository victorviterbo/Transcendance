import type { IGamePlayer, IGameSettings, IGameStatus, IGameUser, TGameVisibility } from "../../../types/game";
import { convExtUserToGameUser, type IExtUserInfo } from "../../../types/user";
import type { IWSGameEventSndList, IWSGameRCVEvent, IWSGameRCVEventSettings, IWSGameSendEvent, IWSGameSendEventGameInfo, IWSGameSendEventPlayerManage, IWSGameSendEventSettings } from "../../../types/websocket";

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
	onSettingsChanged(event: IWSGameRCVEventSettings) {
		this.log("Settings updated by user");
		this.settings = event.settings;
		this.sendEvent({
			...this.getBaseData("settings_updated"),
			event: "settings_updated",
			settings: this.settings
		} as IWSGameSendEventSettings)
	}

	//====================== FUNCTIONS ======================
		//--------------------- WS ---------------------
	rcvEvent(e: IWSGameRCVEvent) {
		switch(e.event) {
		case "game_join":
			this.onJoin();
			break;
		case "settings_update":
			this.onSettingsChanged(e as IWSGameRCVEventSettings);
			break;
		}
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

		
		const check: IGamePlayer | undefined = this.players.find((player: IGamePlayer) => {
			return player.user.uid == user.uid;
		})
		if(!check){
			this.players.push({
				user,
				points: 0,
			});
		}
		

		this.log("Player: '" + user.username + "' has %cjoined%c (" + this.players.length + ")", "font-weight: 900; color:rgb(103, 209, 82)", "font-weight: 400; color: white");
		const event: IWSGameSendEventPlayerManage = {
			...this.getBaseData("player_joined"),
			event: "player_joined",
			player:this.players[this.players.length - 1]
		}
		this.sendEvent(event as IWSGameSendEvent)
	}
	leavePlayer(uid: string) {

		const playerIndex: number = this.players.findIndex((player: IGamePlayer) => {
			return  player.user.uid == uid;
		})
		if(playerIndex == -1)
			return;

		const player = this.players.splice(playerIndex, 1)[0];
		this.log("Player: '" + player.user.username + "' has %cleft%c (" + this.players.length + ")", "font-weight: 900; color: #d81e1e", "font-weight: 400; color: white");
		const event: IWSGameSendEventPlayerManage = {
			...this.getBaseData("player_left"),
			event: "player_left",
			player: player
		}
		this.sendEvent(event as IWSGameSendEvent)
	}

	changeSettings() {
		this.log("Settings updated by mock");
		this.sendEvent({
			...this.getBaseData("settings_updated"),
			event: "settings_updated",
			settings: this.settings
		} as IWSGameSendEventSettings)
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
	simulate(): void {
		if(this.simStarted)
			return;
		super.simulate();

		for (let i = 0; i < 13; i++) {
			const time: number = Math.random() * 6000 + 1000;
			setTimeout(() => {
				this.joinPlayer(convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false));
				//const lastID = this.currentTarget;
				this.currentTarget++;
	
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

				if (lastID == 7) {
					this.joinPlayer(convExtUserToGameUser(mockSocialDB.users[lastID], false));
				}

				if (lastID == 6 || lastID == 9 || lastID == 11) {
					setTimeout(() => {
						this.leavePlayer(mockSocialDB.users[lastID].uid);
					}, 6500);
				}

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
		
		setTimeout(() => {
			this.settings.genres.splice(1,1);
			this.settings.genres.push("TAG_RNB");
			this.settings.mode = "normal";
			this.settings.trackCount = 5
			this.settings.playbackDuration = 15;
			this.settings.breakDuration = 5;
			this.settings.reveal = false;
			this.settings.fuzzy =  true;
			this.changeSettings();
		}, 5000);
	}

}