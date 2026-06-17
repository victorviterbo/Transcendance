import type {
	IGameChatMsg,
	IGamePlayer,
	IGamePlayerResult,
	IGameRound,
	IGameSettings,
	IGameStatus,
	IGameTrack,
	IGameUser,
	TGameVisibility,
} from "../../../types/game";
import { convExtUserToGameUser, type IExtUserInfo } from "../../../types/user";
import type {
	IWSGameEventSndList,
	IWSGameRCVEvent,
	IWSGameRCVEventAnswer,
	IWSGameRCVEventMsg,
	IWSGameRCVEventSettings,
	IWSGameSendEvent,
	IWSGameSendEventError,
	IWSGameSendEventGameEnd,
	IWSGameSendEventGameInfo,
	IWSGameSendEventMessage,
	IWSGameSendEventMessageHistory,
	IWSGameSendEventPlayerManage,
	IWSGameSendEventRoundAnswer,
	IWSGameSendEventRoundAnswerBroadcast,
	IWSGameSendEventRoundEnd,
	IWSGameSendEventRoundStart,
	IWSGameSendEventSettings,
	TWSRoundInfo,
} from "../../../types/websocket";
import { mockDefaultUserUID } from "../../db";

import { mockSocialDB } from "../social/social_dbs";
import { mockGameDB } from "./game_db";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

export function mockHandleGameMessages(
	Data: IWSGameRCVEvent,
	client: WebSocketClientConnectionProtocol,
) {
	if (Data.target != "game") return;
	mockGameDB.client = client;

	const eventGame: MockGame = mockGameDB.getGame(Data.uid);
	eventGame.rcvEvent(Data);
}

//--------------------------------------------------
//                      SETTINGS
//--------------------------------------------------
const MOCK_CONNECTION_SPEED = 1000; //6000

//--------------------------------------------------
//                      LOCAL TYPES
//--------------------------------------------------
interface mockPlayerAnswerSim {
	playerNumber: number;
	try: string;
	at: number;
	round: number;
}
interface mockMsgSim {
	playerNumber: number;
	body: string;
	at: number;
}

//--------------------------------------------------
//                    GAME MOCK
//--------------------------------------------------
export class MockGame {
	//====================== CONSTRUCTOR ======================
	constructor(uid: string, host?: IExtUserInfo) {
		this.uid = uid;
		this.log("Game: '" + uid + "' created");
		if (host) this.host = host;
		else this.host = mockGameDB.getDefaultHost();
		this.buildPlayers();
		this.buildChat();
		this.buildGame();
		this.simulate();
	}
	buildPlayers() {}
	buildChat() {}
	buildGame() {}

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
	};
	rounds: IGameRound[] = [];

	//--------------------- PLAYERS ---------------------
	players: IGamePlayer[] = [];
	roundResult: IGamePlayerResult[] = [];

	//--------------------- Chat ---------------------
	chat: IGameChatMsg[] = [];

	//--------------------- SETTINGS ---------------------
	settings: IGameSettings = mockGameDB.getDefaultSettings();

	//--------------------- MOCK ---------------------
	currentTarget: number = 0;
	simStarted: boolean = false;
	gameStarted: boolean = false;
	answerSimulation: mockPlayerAnswerSim[] = [];
	messageSimulation: mockMsgSim[] = [];

	//====================== EVENTS ======================
	onJoin() {
		this.log("User has join");
		this.log("Sending to new user all game info");

		if (this.players.length >= 20) {
			this.log("Room full");
			this.sendEvent({
				...this.getBaseData("error"),
				message: "ERROR_FULL",
				critical: true,
			} as IWSGameSendEventError);
			return;
		}
		const history: TWSRoundInfo[] = [];
		for (let i = 0; i < this.status.round; i++) {
			history.push({
				track: this.rounds[i].track,
				titleFound: this.rounds[i].titleFound,
				artistFound: this.rounds[i].artistFound,
				time: this.rounds[i].time,
				ranking: 0,
				points: this.rounds[i].points,
				round: i + 1,
			});
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
			history,
		};
		this.sendEvent(gameInfo as IWSGameSendEvent);

		this.log("Sending to new user all chat history");
		this.sendEvent({
			...this.getBaseData("message_history"),
			event: "message_history",
			messages: this.chat,
		} as IWSGameSendEventMessageHistory);

		this.log("Adding user to player list");
		this.joinPlayer(mockGameDB.getSelf());
	}
	onSettingsChanged(event: IWSGameRCVEventSettings) {
		this.log("Settings updated by user");
		this.settings = event.settings;
		this.sendEvent({
			...this.getBaseData("settings_updated"),
			event: "settings_updated",
			settings: this.settings,
		} as IWSGameSendEventSettings);
	}
	onUserAnswer(event: IWSGameRCVEventAnswer) {
		this.logRound("Answer recieved: '" + event.answer + "' at " + event.time.toString());
		const track: IGameTrack | undefined = this.rounds[this.status.round].track;
		if (!track) return;

		if (
			!this.rounds[this.status.round].artistFound &&
			track.artist &&
			event.answer.toLowerCase().includes(track.artist.toLowerCase())
		)
			this.rounds[this.status.round].artistFound = true;
		else if (
			!this.rounds[this.status.round].titleFound &&
			track.title &&
			event.answer.toLowerCase().includes(track.title.toLowerCase())
		)
			this.rounds[this.status.round].titleFound = true;
		this.sendEvent({
			...this.getBaseData("answer_validation"),
			event: "answer_validation",
			titleFound: this.rounds[this.status.round].titleFound,
			artistFound: this.rounds[this.status.round].artistFound,
			time: event.time,
			track:
				this.rounds[this.status.round].titleFound &&
				this.rounds[this.status.round].artistFound
					? this.rounds[this.status.round].track
					: undefined,
		} as IWSGameSendEventRoundAnswer);

		this.simulateAnswer({
			playerNumber: this.players.findIndex(
				(player: IGamePlayer) => player.user.uid == mockDefaultUserUID,
			),
			try: event.answer,
			at: event.time,
			round: this.status.round,
		});
	}
	onUserMessage(event: IWSGameRCVEventMsg) {
		this.log("User has sent a message  message: " + event.message);
		const currentUser: IGamePlayer | undefined = this.players.find(
			(player: IGamePlayer) => player.user.uid == mockDefaultUserUID,
		);
		if (!currentUser) return;
		this.newMSG(event.message, currentUser.user);
	}

	//====================== FUNCTIONS ======================
	//--------------------- WS ---------------------
	rcvEvent(e: IWSGameRCVEvent) {
		switch (e.event) {
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
			case "message_send":
				this.onUserMessage(e as IWSGameRCVEventMsg);
				break;
		}
	}
	sendEvent(data: IWSGameSendEvent) {
		if (!mockGameDB.client) return;
		//console.log(data);
		mockGameDB.client.send(JSON.stringify(data));
	}
	getBaseData(event: IWSGameEventSndList): IWSGameSendEvent {
		return {
			target: "game",
			event,
			uid: this.uid,
			self: mockGameDB.getSelf(),
		};
	}

	//--------------------- Manage ---------------------
	joinPlayer(user: IGameUser) {
		const check: IGamePlayer | undefined = this.players.find((player: IGamePlayer) => {
			return player.user.uid == user.uid;
		});
		if (!check) {
			this.players.push({
				user,
				points: 0,
			});
		}

		this.log(
			"Player: '" + user.username + "' has %cjoined%c (" + this.players.length + ")",
			"font-weight: 900; color:rgb(103, 209, 82)",
			"font-weight: 400; color: white",
		);
		const event: IWSGameSendEventPlayerManage = {
			...this.getBaseData("player_joined"),
			event: "player_joined",
			player: this.players[this.players.length - 1],
		};
		this.sendEvent(event as IWSGameSendEvent);
	}
	leavePlayer(uid: string) {
		const playerIndex: number = this.players.findIndex((player: IGamePlayer) => {
			return player.user.uid == uid;
		});
		if (playerIndex == -1) return;

		const player = this.players.splice(playerIndex, 1)[0];
		this.log(
			"Player: '" + player.user.username + "' has %cleft%c (" + this.players.length + ")",
			"font-weight: 900; color: #d81e1e",
			"font-weight: 400; color: white",
		);
		const event: IWSGameSendEventPlayerManage = {
			...this.getBaseData("player_left"),
			event: "player_left",
			player: player,
		};
		this.sendEvent(event as IWSGameSendEvent);
	}
	getResult(user: IGameUser): IGamePlayerResult {
		let res: IGamePlayerResult | undefined = this.roundResult.find(
			(result: IGamePlayerResult) => {
				return result.user.uid == user.uid;
			},
		);
		if (!res) {
			res = {
				user,
				titleFound: false,
				artistFound: false,
				time: -1,
				ranking: 0,
				points: 0,
			};
			this.roundResult.push(res);
		}
		return res;
	}
	newMSG(body: string, sender: IGameUser) {
		const nMessage: IGameChatMsg = {
			uid: crypto.randomUUID(),
			sender,
			body,
		};
		this.chat.push(nMessage);
		this.log("Sending message from: " + sender.username);
		this.sendEvent({
			...this.getBaseData("message_broadcast"),
			event: "message_broadcast",
			message: nMessage,
		} as IWSGameSendEventMessage);
	}

	changeSettings() {
		this.log("Settings updated by mock");
		this.sendEvent({
			...this.getBaseData("settings_updated"),
			event: "settings_updated",
			settings: this.settings,
		} as IWSGameSendEventSettings);
	}

	//--------------------- Simulate ---------------------
	simulate(): void {
		this.simStarted = true;
		this.simulateMessages();
	}
	simulateGame(): void {
		if (this.gameStarted) return;
		this.gameStarted = true;

		//Creating rounds
		for (let i = 0; i < this.settings.trackCount; i++) {
			this.rounds.push({
				track: mockGameDB.getRoundTrack(i),
				phase: "not-done",
				titleFound: false,
				artistFound: false,
				points: 0,
				time: -1,
				answers: [],
				ranking: 0,
			});
		}

		setTimeout(() => {
			//Calling  game started event
			this.log("Game is starting");
			this.sendEvent({
				...this.getBaseData("game_started"),
				event: "game_started",
				settings: this.settings,
			} as IWSGameSendEventSettings);

			this.simulateGameRound();
		}, 1000);
	}
	simulateGameRound() {
		//Sending preview
		this.logRound("Sending preview");
		this.sendEvent({
			...this.getBaseData("round_preview"),
			event: "round_preview",
			round: this.status.round + 1,
			preview: this.rounds[this.status.round].track.preview,
			playbackDuration: this.settings.playbackDuration,
		} as IWSGameSendEventRoundStart);

		//Sending round start
		setTimeout(() => {
			this.logRound("Sending round start signal");
			this.roundResult = [];
			this.sendEvent({
				...this.getBaseData("round_started"),
				event: "round_started",
				round: this.status.round + 1,
				preview: this.rounds[this.status.round].track.preview,
				playbackDuration: this.settings.playbackDuration,
			} as IWSGameSendEventRoundStart);

			this.answerSimulation.forEach((sim: mockPlayerAnswerSim) => {
				if (sim.round == this.status.round) {
					setTimeout(() => {
						this.simulateAnswer(sim);
					}, sim.at * 1000);
				}
			});

			setTimeout(() => {
				this.simulateRoundEnd();
			}, this.settings.playbackDuration * 1000);
		}, 3000);
	}
	simulateRoundEnd() {
		this.players.forEach((player: IGamePlayer) => {
			this.getResult(player.user);
		});

		this.roundResult.forEach((res: IGamePlayerResult) => {
			if (!res.artistFound || !res.titleFound) res.time = this.settings.playbackDuration;
		});

		this.roundResult.sort((res1: IGamePlayerResult, res2: IGamePlayerResult) => {
			return res1.time - res2.time;
		});

		this.roundResult.forEach((res: IGamePlayerResult, index: number) => {
			res.ranking = index + 1;
			if (res.artistFound && res.titleFound) res.points += 10 - index <= 0 ? 1 : 10 - index;
			const player: IGamePlayer | undefined = this.players.find(
				(targetPlayer: IGamePlayer) => targetPlayer.user.uid == res.user.uid,
			);
			if (!player) return;
			player.points += res.points;
		});

		this.logRound("Round ended");
		this.sendEvent({
			...this.getBaseData("round_ended"),
			event: "round_ended",
			track: this.rounds[this.status.round].track,
			leaderboard: this.players,
			results: this.roundResult,
		} as IWSGameSendEventRoundEnd);

		if (this.status.round >= this.settings.trackCount - 1) {
			setTimeout(() => {
				this.simulateGameEnd();
			}, this.settings.breakDuration * 1000);
			return;
		}
		setTimeout(
			() => {
				this.status.round++;
				this.simulateGameRound();
			},
			(this.settings.breakDuration - 3) * 1000,
		);
	}
	simulateAnswer(sim: mockPlayerAnswerSim) {
		const player: IGamePlayer = this.players[sim.playerNumber];
		this.logRound(
			"Answer recieved from '" +
				player.user.username +
				"': '" +
				sim.try +
				"' at " +
				sim.at.toString(),
		);
		let res: IGamePlayerResult | undefined = this.roundResult.find(
			(result: IGamePlayerResult) => {
				return result.user.uid == player.user.uid;
			},
		);
		if (!res) {
			res = {
				user: player.user,
				titleFound: false,
				artistFound: false,
				time: -1,
				ranking: 0,
				points: 0,
			};
			this.roundResult.push(res);
		}
		const track: IGameTrack | undefined = this.rounds[this.status.round].track;
		if (
			!res.artistFound &&
			track.artist &&
			sim.try.toLowerCase().includes(track.artist.toLowerCase())
		) {
			res.artistFound = true;
			res.points += 5;
			res.time = res.time < sim.at ? sim.at : res.time;
		} else if (
			!res.titleFound &&
			track.title &&
			sim.try.toLowerCase().includes(track.title.toLowerCase())
		) {
			res.titleFound = true;
			res.points += 5;
			res.time = res.time < sim.at ? sim.at : res.time;
		}

		this.sendEvent({
			...this.getBaseData("answer_broadcast"),
			event: "answer_broadcast",
			player: player.user,
			kind:
				res.artistFound && res.titleFound
					? "bothFound"
					: res.artistFound
						? "artistFound"
						: res.titleFound
							? "titleFound"
							: "incorrect",
			answer: !res.artistFound && !res.titleFound ? sim.try : undefined,
		} as IWSGameSendEventRoundAnswerBroadcast);
	}
	simulateMessages() {
		this.messageSimulation.forEach((sim: mockMsgSim) => {
			setTimeout(() => {
				this.newMSG(sim.body, this.players[sim.playerNumber].user);
			}, sim.at * 1000);
		});
	}
	simulateGameEnd() {
		const history: TWSRoundInfo[] = [];
		for (let i = 0; i < this.rounds.length; i++) {
			history.push({
				track: this.rounds[i].track,
				titleFound: this.rounds[i].titleFound,
				artistFound: this.rounds[i].artistFound,
				time: this.rounds[i].time,
				ranking: this.rounds[i].ranking,
				points: this.rounds[i].points,
				round: i + 1,
			});
		}
		this.sendEvent({
			...this.getBaseData("game_ended"),
			event: "game_ended",
			history,
			leaderboard: this.players,
		} as IWSGameSendEventGameEnd);
	}

	//--------------------- LOGs ---------------------
	log(MSG: string, ...Styling: string[]) {
		console.log(
			"[%cMOCK-GAME%c]: " + MSG,
			"font-weight: 900; color: #ca15e2",
			"font-weight: 400; color: white",
			...Styling,
		);
	}
	logRound(MSG: string, ...Styling: string[]) {
		this.log(
			"%c(Round: %c" +
				(this.status.round + 1) +
				"%c / %c" +
				this.settings.trackCount +
				"%c)%c - " +
				MSG,
			"font-weight: 900",
			"font-weight: 900; color: #0fbedd",
			"font-weight: 900; color: white",
			"font-weight: 900; color: #728bdd",
			"font-weight: 900; color: white",
			"font-weight: 400",
			...Styling,
		);
	}
}

//--------------------------------------------------
//                     PLAYING
//--------------------------------------------------
export class MockGamePlaying extends MockGame {
	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid);
		this.name = "Active game room";
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
		this.name = "John's room";
		this.log("Game (Hosting): '" + uid + "' created");
	}

	//====================== DATA ======================
	simulate(): void {
		if (this.simStarted) return;
		super.simulate();

		for (let i = 0; i < 13; i++) {
			const time: number = Math.random() * MOCK_CONNECTION_SPEED + 1000;
			setTimeout(() => {
				this.joinPlayer(
					convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				);
				this.currentTarget++;
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
		this.name = "Sarah's room";
		this.log("Game (Joining): '" + uid + "' created");
	}
	buildPlayers(): void {
		super.buildPlayers();
		for (; this.currentTarget < 4; this.currentTarget++) {
			this.players.push({
				user: convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				points: 0,
			});
		}
	}

	//====================== FUNCTIONS ======================
	//--------------------- Simulate ---------------------
	simulate(): void {
		if (this.simStarted) return;
		super.simulate();

		for (let i = 0; i < 15; i++) {
			const time: number = Math.random() * MOCK_CONNECTION_SPEED + 1000;
			setTimeout(() => {
				this.joinPlayer(
					convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				);
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
			}, time);
		}

		setTimeout(() => {
			this.settings.genres.splice(1, 1);
			this.settings.genres.push("TAG_RNB");
			this.settings.mode = "normal";
			this.settings.trackCount = 5;
			this.settings.playbackDuration = 15;
			this.settings.breakDuration = 5;
			this.settings.reveal = false;
			this.settings.fuzzy = true;
			this.changeSettings();
		}, 5000);
	}
}

export class MockGameJoiningSpeed extends MockGame {
	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid, mockSocialDB.users[0]);
		this.name = "Sarah's speed room";
		this.log("Game (Joining - Speed): '" + uid + "' created");
	}
	buildPlayers(): void {
		super.buildPlayers();
		for (; this.currentTarget < 4; this.currentTarget++) {
			this.players.push({
				user: convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				points: 0,
			});
		}

		//R1
		this.answerSimulation.push({ playerNumber: 0, try: "Timbaland", round: 0, at: 5.25 });
		this.answerSimulation.push({ playerNumber: 0, try: "Timbaland", round: 0, at: 6.25 });
		this.answerSimulation.push({ playerNumber: 0, try: "The way I are", round: 0, at: 10.56 });
		this.answerSimulation.push({ playerNumber: 1, try: "Shakira", round: 0, at: 5 });
		this.answerSimulation.push({ playerNumber: 1, try: "Timbaland", round: 0, at: 8.5 });
		this.answerSimulation.push({ playerNumber: 2, try: "John", round: 0, at: 8.5 });
		this.answerSimulation.push({ playerNumber: 2, try: "Elvis", round: 0, at: 12 });
		this.answerSimulation.push({ playerNumber: 2, try: "I DONT KNOW", round: 0, at: 18 });
		this.answerSimulation.push({ playerNumber: 6, try: "Dua", round: 0, at: 15 });
		this.answerSimulation.push({ playerNumber: 6, try: "Timbaland", round: 0, at: 18 });
		this.answerSimulation.push({ playerNumber: 7, try: "Timbaland", round: 0, at: 10 });
		this.answerSimulation.push({ playerNumber: 7, try: "The way I are", round: 0, at: 19 });

		//R2
		this.answerSimulation.push({ playerNumber: 0, try: "soprano", round: 1, at: 2 });
		this.answerSimulation.push({ playerNumber: 0, try: "c'est ma vie", round: 1, at: 15 });
		this.answerSimulation.push({ playerNumber: 0, try: "c'est ma life", round: 1, at: 18 });
		this.answerSimulation.push({ playerNumber: 1, try: "booba", round: 1, at: 5 });
		this.answerSimulation.push({ playerNumber: 1, try: "NTM", round: 1, at: 8 });
		this.answerSimulation.push({ playerNumber: 1, try: "Cortex ?", round: 1, at: 15 });
		this.answerSimulation.push({ playerNumber: 1, try: "c'est ma life", round: 1, at: 19 });
		this.answerSimulation.push({ playerNumber: 2, try: "c'est la vie", round: 1, at: 2 });
		this.answerSimulation.push({ playerNumber: 2, try: "c'est la life", round: 1, at: 3 });
		this.answerSimulation.push({ playerNumber: 2, try: "c'est ma life", round: 1, at: 4 });
		this.answerSimulation.push({ playerNumber: 9, try: "sopano", round: 1, at: 4 });
		this.answerSimulation.push({ playerNumber: 9, try: "soprano", round: 1, at: 5 });
		this.answerSimulation.push({ playerNumber: 9, try: "c'est ma life", round: 1, at: 17 });

		//R3
		this.answerSimulation.push({ playerNumber: 0, try: "wait B", round: 2, at: 2 });
		this.answerSimulation.push({ playerNumber: 0, try: "Big ali express", round: 2, at: 3 });
		this.answerSimulation.push({ playerNumber: 0, try: "aaaaaaaaaaaaaaaa", round: 2, at: 6 });
		this.answerSimulation.push({ playerNumber: 0, try: "Morenas", round: 2, at: 6 });
		this.answerSimulation.push({ playerNumber: 1, try: "Morenas", round: 2, at: 6 });
		this.answerSimulation.push({ playerNumber: 1, try: "Lord Kossity", round: 2, at: 7 });
		this.answerSimulation.push({ playerNumber: 6, try: "Morenas", round: 2, at: 6 });
		this.answerSimulation.push({ playerNumber: 6, try: "Lod Kossity", round: 2, at: 12 });
		this.answerSimulation.push({ playerNumber: 6, try: "Lod Kossityy", round: 2, at: 13 });
		this.answerSimulation.push({ playerNumber: 6, try: "Lord Kossityy", round: 2, at: 13.5 });
		this.answerSimulation.push({ playerNumber: 6, try: "Lord Kossity", round: 2, at: 14 });
		this.answerSimulation.push({ playerNumber: 8, try: "Lord Kossity", round: 2, at: 1 });
		this.answerSimulation.push({ playerNumber: 8, try: "Morenas", round: 2, at: 2 });

		//R4
		this.answerSimulation.push({ playerNumber: 0, try: "cardi B", round: 3, at: 2 });
		this.answerSimulation.push({ playerNumber: 0, try: "Kelis", round: 3, at: 5 });
		this.answerSimulation.push({ playerNumber: 0, try: "Milkshake", round: 3, at: 15 });
		this.answerSimulation.push({ playerNumber: 3, try: "Milkshake", round: 3, at: 1 });
		this.answerSimulation.push({ playerNumber: 3, try: "Kelis", round: 3, at: 19.5 });
		this.answerSimulation.push({ playerNumber: 2, try: "Morenas", round: 3, at: 5 });
		this.answerSimulation.push({ playerNumber: 2, try: "Lord Kossity", round: 3, at: 6 });
		this.answerSimulation.push({ playerNumber: 6, try: "Milkshake", round: 3, at: 7 });
		this.answerSimulation.push({ playerNumber: 7, try: "Milkshake", round: 3, at: 15 });
		this.answerSimulation.push({ playerNumber: 8, try: "Milkshake", round: 3, at: 16 });
		this.answerSimulation.push({ playerNumber: 8, try: "Kelis", round: 3, at: 5 });

		//R5
		this.answerSimulation.push({ playerNumber: 0, try: "wati B", round: 4, at: 2 });
		this.answerSimulation.push({ playerNumber: 0, try: "wati Big ali ?", round: 4, at: 3 });
		this.answerSimulation.push({ playerNumber: 0, try: "DJ Abdel", round: 4, at: 6 });
		this.answerSimulation.push({ playerNumber: 0, try: "Funk", round: 4, at: 10 });
		this.answerSimulation.push({
			playerNumber: 1,
			try: "Donnez Nous De La Funk",
			round: 4,
			at: 10,
		});
		this.answerSimulation.push({ playerNumber: 1, try: "DJ Abdel", round: 4, at: 11 });
		this.answerSimulation.push({ playerNumber: 2, try: "DJ Khaled", round: 4, at: 11 });
		this.answerSimulation.push({ playerNumber: 6, try: "DJ Abdel", round: 4, at: 11 });
		this.answerSimulation.push({ playerNumber: 8, try: "Funk", round: 4, at: 11 });
		this.answerSimulation.push({
			playerNumber: 8,
			try: "Donnez Nous De La Funk",
			round: 4,
			at: 11,
		});
		this.answerSimulation.push({ playerNumber: 8, try: "DJ Abdel", round: 4, at: 11 });
	}

	buildChat() {
		this.chat.push({
			uid: crypto.randomUUID(),
			sender: this.players[0].user,
			body: "Helly everyone",
		});
		this.chat.push({
			uid: crypto.randomUUID(),
			sender: this.players[1].user,
			body: "hey !!",
		});
		this.chat.push({
			uid: crypto.randomUUID(),
			sender: this.players[1].user,
			body: "Woaaaa I have to  write a long message to test if it displays goods on the screen and I don't look like nothing !!!!",
		});
		this.chat.push({
			uid: crypto.randomUUID(),
			sender: this.players[0].user,
			body: "TG",
		});
		this.chat.push({
			uid: crypto.randomUUID(),
			sender: this.players[1].user,
			body: "Hey !!! j'essaie d'etre utile moi au moin...",
		});
		this.chat.push({
			uid: crypto.randomUUID(),
			sender: this.players[2].user,
			body: "Calma",
		});

		this.messageSimulation.push({ playerNumber: 1, body: "Are you guys ready ?", at: 1 });

		this.messageSimulation.push({ playerNumber: 2, body: "Yeah", at: 2.5 });
		this.messageSimulation.push({ playerNumber: 3, body: "Yeah", at: 3 });
		this.messageSimulation.push({ playerNumber: 8, body: "No", at: 4.5 });
		this.messageSimulation.push({ playerNumber: 8, body: "You guys suck", at: 10 });
		this.messageSimulation.push({
			playerNumber: 1,
			body: "I think I know this one no ?",
			at: 11,
		});
		this.messageSimulation.push({ playerNumber: 2, body: "Hey !! Igot it", at: 12 });
		this.messageSimulation.push({ playerNumber: 0, body: "John you suck", at: 20 });
		this.messageSimulation.push({ playerNumber: 9, body: "Those songs sucks", at: 22 });
		this.messageSimulation.push({ playerNumber: 8, body: "おれは最高だ", at: 23 });
	}

	//====================== FUNCTIONS ======================
	//--------------------- Simulate ---------------------
	simulate(): void {
		if (this.simStarted) return;
		super.simulate();

		for (let i = 0; i < 5; i++) {
			const time: number = 250 * i;
			setTimeout(() => {
				this.joinPlayer(
					convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				);
				const lastID = this.currentTarget;
				this.currentTarget++;

				if (lastID == 7) {
					this.joinPlayer(convExtUserToGameUser(mockSocialDB.users[lastID], false));
				}
			}, time);
		}

		setTimeout(() => {
			this.settings.genres.splice(1, 1);
			this.settings.genres.push("TAG_RNB");
			this.settings.mode = "speed";
			this.settings.trackCount = 5;
			this.settings.playbackDuration = 20;
			this.settings.breakDuration = 15;
			this.settings.reveal = true;
			this.settings.fuzzy = true;
			this.changeSettings();
		}, 250);

		setTimeout(() => {
			this.simulateGame();
		}, 1000);
	}
}

//--------------------------------------------------
//                     Ended
//--------------------------------------------------
export class MockGameJoiningEnded extends MockGame {
	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid, mockSocialDB.users[0]);
		this.name = "Sarah's ended room";
		this.log("Game (Ended): '" + uid + "' created");

		this.settings.genres.splice(1, 1);
		this.settings.genres.push("TAG_RNB");
		this.settings.mode = "speed";
		this.settings.trackCount = 5;
		this.settings.playbackDuration = 20;
		this.settings.breakDuration = 15;
		this.settings.reveal = true;
		this.settings.fuzzy = true;
	}
	buildPlayers(): void {
		super.buildPlayers();
		for (; this.currentTarget < 4; this.currentTarget++) {
			this.players.push({
				user: convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				points: this.currentTarget * 5,
			});
		}
	}

	buildChat() {}

	buildGame(): void {
		this.rounds.push({
			track: mockGameDB.getRoundTrack(0),
			phase: "done",
			titleFound: true,
			artistFound: true,
			points: 15,
			time: 6.58,
			ranking: 2,
			answers: [],
		});

		this.rounds.push({
			track: mockGameDB.getRoundTrack(1),
			phase: "done",
			titleFound: false,
			artistFound: true,
			points: 5,
			time: 15.25,
			ranking: 4,
			answers: [],
		});

		this.rounds.push({
			track: mockGameDB.getRoundTrack(2),
			phase: "done",
			titleFound: false,
			artistFound: false,
			points: 0,
			time: 20,
			ranking: 5,
			answers: [],
		});

		this.rounds.push({
			track: mockGameDB.getRoundTrack(3),
			phase: "done",
			titleFound: true,
			artistFound: true,
			points: 15,
			time: 19.4,
			ranking: 10,
			answers: [],
		});

		this.rounds.push({
			track: mockGameDB.getRoundTrack(4),
			phase: "done",
			titleFound: true,
			artistFound: false,
			points: 0,
			time: 5.25,
			ranking: 5,
			answers: [],
		});
	}

	//====================== FUNCTIONS ======================
	//--------------------- Simulate ---------------------
	simulate(): void {
		if (this.simStarted) return;
		super.simulate();

		setTimeout(() => {
			this.players[4].points = 50;
			this.simulateGameEnd();
		}, 1000);
	}
}

//--------------------------------------------------
//                     ERROR
//--------------------------------------------------
export class MockGameJoiningError extends MockGame {
	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid, mockSocialDB.users[0]);
		this.name = "Sarah's error room";
		this.log("Game (Error): '" + uid + "' created");

		this.settings.genres.splice(1, 1);
		this.settings.genres.push("TAG_RNB");
		this.settings.mode = "speed";
		this.settings.trackCount = 5;
		this.settings.playbackDuration = 20;
		this.settings.breakDuration = 15;
		this.settings.reveal = true;
		this.settings.fuzzy = true;
	}
	buildPlayers(): void {
		super.buildPlayers();
		for (; this.currentTarget < 4; this.currentTarget++) {
			this.players.push({
				user: convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				points: this.currentTarget * 5,
			});
		}
	}

	//====================== FUNCTIONS ======================
	//--------------------- Simulate ---------------------
	simulate(): void {
		if (this.simStarted) return;
		super.simulate();

		setTimeout(() => {
			this.sendEvent({
				...this.getBaseData("error"),
				message: "Failed to load chat history",
			} as IWSGameSendEventError);
		}, 1000);

		setTimeout(() => {
			this.sendEvent({
				...this.getBaseData("error"),
				message: "Failed to load game",
				critical: true,
			} as IWSGameSendEventError);
		}, 5000);
	}
}

export class MockGameJoiningFull extends MockGame {
	//====================== CONSTRUCTOR ======================
	constructor(uid: string) {
		super(uid, mockSocialDB.users[0]);
		this.name = "Sarah's full room";
		this.log("Game (Error - full): '" + uid + "' created");

		this.settings.genres.splice(1, 1);
		this.settings.genres.push("TAG_RNB");
		this.settings.mode = "speed";
		this.settings.trackCount = 5;
		this.settings.playbackDuration = 20;
		this.settings.breakDuration = 15;
		this.settings.reveal = true;
		this.settings.fuzzy = true;
	}
	buildPlayers(): void {
		super.buildPlayers();
		for (; this.currentTarget < 20; this.currentTarget++) {
			this.players.push({
				user: convExtUserToGameUser(mockSocialDB.users[this.currentTarget], false),
				points: this.currentTarget * 5,
			});
		}
	}

	//====================== FUNCTIONS ======================
	//--------------------- Simulate ---------------------
	simulate(): void {}
}
