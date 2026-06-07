import type { IGamePlayer, IGamePlayerResult, IGameRound, IGameSettings, IGameStatus, IGameTrack, IGameUser, TGameVisibility } from "../../../types/game";
import { convExtUserToGameUser, type IExtUserInfo } from "../../../types/user";
import type { IWSGameEventSndList, IWSGameRCVEvent, IWSGameRCVEventAnswer, IWSGameRCVEventSettings, IWSGameSendEvent, IWSGameSendEventGameInfo, IWSGameSendEventPlayerManage, IWSGameSendEventRoundAnswer, IWSGameSendEventRoundAnswerBroadcast, IWSGameSendEventRoundEnd, IWSGameSendEventRoundStart, IWSGameSendEventSettings, TWSRoundInfo } from "../../../types/websocket";
import { mockDefaultUserUID } from "../../db";

import { mockSocialDB } from "../social/social_dbs";
import { mockGameDB } from "./game_db";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

export function mockHandleGameMessages(Data: IWSGameRCVEvent, client: WebSocketClientConnectionProtocol) {
	if (Data.target != "game") return;
	mockGameDB.client = client;

	const eventGame: MockGame = mockGameDB.getGame(Data.uid);
	eventGame.rcvEvent(Data);
}


//--------------------------------------------------
//                      SETTINGS
//--------------------------------------------------
const MOCK_CONNECTION_SPEED = 1000 //6000


//--------------------------------------------------
//                      LOCAL TYPES
//--------------------------------------------------
interface mockPlayerAnswerSim {
	playerNumber: number;
	try: string;
	at: number;
	round: number;
}


//--------------------------------------------------
//                    GAME MOCK
//--------------------------------------------------
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
	rounds: IGameRound[] = [];

		//--------------------- PLAYERS ---------------------
	players: IGamePlayer[] = [];
	roundResult: IGamePlayerResult[] = []
	

		//--------------------- SETTINGS ---------------------
	settings: IGameSettings = mockGameDB.getDefaultSettings();
	
		//--------------------- MOCK ---------------------
	currentTarget: number = 0;
	simStarted: boolean = false;
	gameStarted: boolean = false;
	answerSimulation: mockPlayerAnswerSim[] = []


	//====================== EVENTS ======================
	onJoin()
	{
		this.log("User has join");
		this.log("Sending to new user all game info");
		const history: TWSRoundInfo[] = [];
		for(let i = 0; i < this.status.round; i++)
		{
			history.push({
				track: this.rounds[i].track,
				titleFound: this.rounds[i].titleFound,
				artistFound: this.rounds[i].artistFound,
				time: this.rounds[i].time,
				ranking: 0,
				points: this.rounds[i].points,
				round: i + 1,
			})
		}
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
			history
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
	onUserAnswer(event: IWSGameRCVEventAnswer) {
		this.logRound("Answer recieved: '" + event.answer + "' at " + event.time.toString());
		const track: IGameTrack | undefined = this.rounds[this.status.round].track;
		if(!track)
			return;
		
		if(!this.rounds[this.status.round].artistFound 
			&& track.artist 
			&& event.answer.toLowerCase().includes(
				track.artist.toLowerCase()
			))
			this.rounds[this.status.round].artistFound = true;
		else if(!this.rounds[this.status.round].titleFound 
			&& track.title 
			&& event.answer.toLowerCase().includes(
				track.title.toLowerCase()
			))
			this.rounds[this.status.round].titleFound = true;
		this.sendEvent({
			...this.getBaseData("answer_validation"),
			event: "answer_validation",
			titleFound: this.rounds[this.status.round].titleFound,
			artistFound: this.rounds[this.status.round].artistFound,
			time: event.time,
			track: this.rounds[this.status.round].titleFound && this.rounds[this.status.round].artistFound ? this.rounds[this.status.round].track : undefined,
		} as IWSGameSendEventRoundAnswer)

		this.simulateAnswer({
			playerNumber: this.players.findIndex((player: IGamePlayer) => player.user.uid == mockDefaultUserUID),
			try: event.answer,
			at: event.time,
			round: this.status.round
		})
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
		case "game_start":
			this.simulateGame();
			break;
		case "answer_submit":
			this.onUserAnswer(e as IWSGameRCVEventAnswer);
			break;
		}
	}
	sendEvent(data: IWSGameSendEvent) {
		if(!mockGameDB.client)
			return;
		//console.log(data);
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
	getResult(user: IGameUser): IGamePlayerResult{
		let res: IGamePlayerResult | undefined = this.roundResult.find((result: IGamePlayerResult) => {
			return result.user.uid == user.uid;
		})
		if(!res)
		{
			res = {
				user,
				titleFound: false,
				artistFound: false,
				time: -1,
				ranking: 0,
				points: 0,
			}
			this.roundResult.push(res);
		}
		return res;
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
	simulateGame(): void  {
		if(this.gameStarted)
			return
		this.gameStarted = true;


		//Creating rounds
		for(let i = 0; i < this.settings.trackCount; i++) {
			this.rounds.push({
				track: mockGameDB.getRoundTrack(i),
				phase: "not-done",
				titleFound: false,
				artistFound: false,
				points: 0,
				time: -1,
				answers: []
			})
		}


		setTimeout(() => {

			//Calling  game started event
			this.log("Game is starting");
			this.sendEvent({
				...this.getBaseData("game_started"),
				event: "game_started",
				settings: this.settings
			} as IWSGameSendEventSettings)

			this.simulateGameRound();
		}, 1000)
	}
	simulateGameRound() {

		//Sending preview
		this.logRound("Sending preview");
		this.sendEvent({
			...this.getBaseData("round_preview"),
			event: "round_preview",
			round: this.status.round + 1,
			preview: this.rounds[this.status.round].track.preview,
			playbackDuration: this.settings.playbackDuration
		} as IWSGameSendEventRoundStart)

		//Sending round start
		setTimeout(() => {
			this.logRound("Sending round start signal");
			this.roundResult = [];
			this.sendEvent({
				...this.getBaseData("round_started"),
				event: "round_started",
				round: this.status.round + 1,
				preview: this.rounds[this.status.round].track.preview,
				playbackDuration: this.settings.playbackDuration
			} as IWSGameSendEventRoundStart)
			
			this.answerSimulation.forEach((sim: mockPlayerAnswerSim) => {
				if(sim.round == this.status.round)
				{
					setTimeout(() => {
						this.simulateAnswer(sim);
					}, sim.at * 1000);
				}
			})

			setTimeout(() => {
				this.simulateRoundEnd()
			}, this.settings.playbackDuration * 1000)
		}, 3000)
	}
	simulateRoundEnd() {

		this.players.forEach((player: IGamePlayer) => {
			this.getResult(player.user);
		})

		this.roundResult.forEach((res: IGamePlayerResult) => {
			if(!res.artistFound || !res.titleFound)
				res.time = this.settings.playbackDuration;
		})
		
		this.roundResult.sort((res1: IGamePlayerResult, res2: IGamePlayerResult) => {
			return res1.time - res2.time;
		})

		this.roundResult.forEach((res: IGamePlayerResult, index: number) => {
			res.ranking = index + 1;
			if(res.artistFound && res.titleFound)
				res.points += (10 - index) <= 0 ? 1 : (10 - index);
			const player: IGamePlayer | undefined = this.players.find((targetPlayer: IGamePlayer) => targetPlayer.user.uid == res.user.uid)
			if(!player)
				return;
			player.points += res.points;
		})


		this.logRound("Round ended");
		this.sendEvent({
			...this.getBaseData("round_ended"),
			event: "round_ended",
			track: this.rounds[this.status.round].track,
			leaderboard: this.players,
			results: this.roundResult,
		} as IWSGameSendEventRoundEnd)

		setTimeout(() => {
			this.status.round++;
			this.simulateGameRound()
		}, (this.settings.breakDuration - 3) * 1000);
	}
	simulateAnswer(sim: mockPlayerAnswerSim){
		const player: IGamePlayer = this.players[sim.playerNumber];
		this.logRound("Answer recieved from '" + player.user.username + "': '" + sim.try + "' at " + sim.at.toString());
		let res: IGamePlayerResult | undefined = this.roundResult.find((result: IGamePlayerResult) => {
			return result.user.uid == player.user.uid;
		})
		if(!res)
		{
			res = {
				user: player.user,
				titleFound: false,
				artistFound: false,
				time: -1,
				ranking: 0,
				points: 0,
			}
			this.roundResult.push(res);
		}
		const track: IGameTrack | undefined = this.rounds[this.status.round].track;
		if(!res.artistFound 
			&& track.artist 
			&& sim.try.toLowerCase().includes(
				track.artist.toLowerCase()
			))
		{
			res.artistFound = true;
			res.points += 5;
			res.time = res.time < sim.at ?  sim.at : res.time;
		}
		else if(!res.titleFound 
			&& track.title 
			&& sim.try.toLowerCase().includes(
				track.title.toLowerCase()
			))
		{
			res.titleFound = true;
			res.points += 5;
			res.time = res.time < sim.at ?  sim.at : res.time;
		}

		this.sendEvent({
			...this.getBaseData("answer_broadcast"),
			event: "answer_broadcast",
			player: player.user,
			kind: res.artistFound && res.titleFound ? "bothFound" : (res.artistFound ? "artistFound" : (res.titleFound ? "titleFound" : "incorrect")),
			answer: !res.artistFound && !res.titleFound ? sim.try : undefined
		} as IWSGameSendEventRoundAnswerBroadcast)
	}
	
		//--------------------- LOGs ---------------------
	log(MSG: string, ...Styling: string[]){
		console.log("[%cMOCK-GAME%c]: " + MSG, "font-weight: 900; color: #ca15e2", "font-weight: 400; color: white", ...Styling);
	}
	logRound(MSG: string, ...Styling: string[]){
		this.log("%c(Round: %c" + (this.status.round + 1) + "%c / %c" + this.settings.trackCount + "%c)%c - " + MSG, 
			"font-weight: 900", 
			"font-weight: 900; color: #0fbedd", 
			"font-weight: 900; color: white", 
			"font-weight: 900; color: #728bdd", 
			"font-weight: 900; color: white",  
			"font-weight: 400", 
			...Styling
		)
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
			const time: number = Math.random() * MOCK_CONNECTION_SPEED + 1000;
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
			const time: number = Math.random() * MOCK_CONNECTION_SPEED + 1000;
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

export class MockGameJoiningSpeed extends MockGame {


	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid, mockSocialDB.users[0]);
		this.name = "Sarah's speed room"
		this.log("Game (Joining - Speed): '" + uid + "' created");
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

		this.answerSimulation.push({playerNumber: 0, try: "Timbaland", round: 0, at: 5.25});
		this.answerSimulation.push({playerNumber: 0, try: "Timbaland", round: 0, at: 6.25});
		this.answerSimulation.push({playerNumber: 0, try: "The way I are", round: 0, at: 10.56});
	}


	//====================== FUNCTIONS ======================
		//--------------------- Simulate ---------------------
	simulate(): void  {
		if(this.simStarted)
			return;
		super.simulate();

		for (let i = 0; i < 5; i++) {
			const time: number = 250 * i;
			setTimeout(() => {
				this.joinPlayer(convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false));
				const lastID = this.currentTarget;
				this.currentTarget++;

				if (lastID == 7) {
					this.joinPlayer(convExtUserToGameUser(mockSocialDB.users[lastID], false));
				}
			}, time);
		}
		
		setTimeout(() => {
			this.settings.genres.splice(1,1);
			this.settings.genres.push("TAG_RNB");
			this.settings.mode = "speed";
			this.settings.trackCount = 5;
			this.settings.playbackDuration = 20;
			this.settings.breakDuration = 15;
			this.settings.reveal = true;
			this.settings.fuzzy =  true;
			this.changeSettings();
		}, 250);

		setTimeout(() => {
			this.simulateGame();
		}, 1000);
	}

}