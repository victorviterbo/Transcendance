import type { SendMessage } from "react-use-websocket";
import type { IGameChatMsg, IGameData, IGamePlayer, IGamePlayerAnswer, IGamePlayerResult, IGameRound, IGameSettings, IGameStatus, IGameUser, TGameVisibility } from "../types/game";
import type { IWSGameEventRcvList, IWSGameRCVEvent, IWSGameRCVEventAnswer, IWSGameRCVEventSettings, IWSGameSendEvent, IWSGameSendEventGameInfo, IWSGameSendEventPlayerManage, IWSGameSendEventRoundAnswer, IWSGameSendEventRoundAnswerBroadcast, IWSGameSendEventRoundStart, IWSGameSendEventSettings, TWSRoundInfo } from "../types/websocket";
import type { ReactNode } from "react";
import { MUSIC_TAGS, PAGE_GAME } from "../constants";


export interface IGameInstanceCallbacks {
	setReady: React.Dispatch<React.SetStateAction<boolean>>;
	setError: React.Dispatch<React.SetStateAction<ReactNode>>;
	setStatus: React.Dispatch<React.SetStateAction<IGameStatus | undefined>>;
	setSettings: React.Dispatch<React.SetStateAction<IGameSettings | undefined>>
	setRounds: React.Dispatch<React.SetStateAction<IGameRound[]>>
	setPlayers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>
	setResults: React.Dispatch<React.SetStateAction<IGamePlayerResult[]>>
	setVolume: React.Dispatch<React.SetStateAction<number>>
	sendMessage: SendMessage;
}

export class GameInstance {

	//====================== CONSTRUCTOR ======================
	constructor(uid: string, callbacks: IGameInstanceCallbacks) {
		this.uid = uid;
		this.callbacks = callbacks;
		this.log("New game instance created");
		this.log("Loading....");

		//Joining
		this.join();
		this.gameLink = PAGE_GAME.replaceAll("{UID}", this.uid);
	}
	destroy() {
		this.uid = "";
		this.log("Destroying game instance");
	}
	
	//====================== DATA ======================
		//--------------------- Info ---------------------
	uid: string;
	name: string = "N/A";
	host?: IGameUser;
	isHost: boolean = false;
	visibility: TGameVisibility = "public";
	maxPlayers: number = 0;

		//--------------------- Status ---------------------
	status: IGameStatus = {
		phase: "waiting",
		round: 0,
		keyTime: 0,
	};
	rounds: IGameRound[] = [];
	songs: (HTMLAudioElement | undefined)[] = [];

		//--------------------- Settings ---------------------
	settings?: IGameSettings;

		//--------------------- PLayers ---------------------
	players: IGamePlayer[] = [];
	roundResult: IGamePlayerResult[] = []

		//--------------------- Callbacks ---------------------
	callbacks: IGameInstanceCallbacks;
	
		//--------------------- Other ---------------------
	self?: IGameUser ;
	lastColorId: number = 0;
	gameLink: string;
	volume = 50;


	//====================== EVENTS ======================
		//Server events
	onGameJoined(data: IWSGameSendEventGameInfo) {
		this.log("Game joined");
		this.log("Parsing data");
		this.name = data.game.name;
		this.host = data.game.owner;
		this.isHost = data.game.owner.uid == data.self.uid;
		this.self = data.self;
		this.maxPlayers= data.game.maxPlayers
		this.visibility = data.game.visibility;

		
		this.status = {
			phase: data.game.status,
			round: data.game.round,
			keyTime: 0,
		};
		this.settings = data.settings;
		this.players = data.leaderboard;

		this.checkRounds();
		data.history.forEach((round: TWSRoundInfo) => {
			this.applyWSRound(round);
		})

		this.updateAll();
		this.callbacks.setReady(true);
		this.log("Game ready");
	}
	onPlayerJoined(data: IWSGameSendEventPlayerManage) {
		this.log("Player: '" + data.player.user.username + "' has joined");
		if(!this.players.find((player: IGamePlayer) => player.user.uid == data.player.user.uid))
			this.players.push(data.player);
		this.updatePlayers();
	}
	onPlayerLeft(data: IWSGameSendEventPlayerManage) {
		const playerIndex: number = this.players.findIndex((player: IGamePlayer) => player.user.uid == data.player.user.uid)
		if(!playerIndex)
			return;
		const player: IGamePlayer = this.players.splice(playerIndex, 1)[0];
		this.log("Player: '" + player.user.username + "' has left");
		this.updatePlayers();
	}
	onSettingsChanged(data: IWSGameSendEventSettings) {
		this.log("Settings changed");
		this.settings = data.settings;
		this.updateSettings();
	}
	onGameStart(data: IWSGameSendEventSettings)
	{
		this.log("Game started");
		this.settings = data.settings;
		this.updateSettings();
		this.status.keyTime = Date.now();
		this.status.phase = "count";
		this.updateStatus();
	}
	onPreviewRecieve(data: IWSGameSendEventRoundStart)
	{
		this.logRound("Preview recieved");
		this.checkRounds();
		this.setRound(data.preview, data.round - 1);
		this.updateRounds();
	}
	onRoundStart(data: IWSGameSendEventRoundStart)
	{
		this.status.round = data.round - 1;
		this.logRound("Starting round");
		this.status.keyTime = Date.now();
		this.status.phase = "playing_round";
		this.setRound(data.preview, this.status.round , true);
		this.rounds[this.status.round].phase = "playing";
		this.songs[this.status.round]?.play();
		this.updateRounds();
		this.updateStatus();
	}
	onAnswerValidation(data: IWSGameSendEventRoundAnswer)
	{
		this.logRound("Answer validation recieved for " + data.time.toString());
		const answer: IGamePlayerAnswer | undefined = this.getRound().answers.find((answer: IGamePlayerAnswer) => {
			return !answer.validated && answer.time == data.time;
		})
		if(!answer)	
		{
			this.warnRound("Failed to fecth  " + data.time.toString());
			return;
		}
		answer.titleFound = data.titleFound;
		answer.artistFound = data.artistFound;
		answer.validated = true;

		if(!this.getRound().titleFound && data.titleFound)
			this.getRound().titleFoundAt = data.time;
		if(!this.getRound().artistFound && data.artistFound)
			this.getRound().artistFoundAt = data.time;

		this.getRound().titleFound = data.titleFound;
		this.getRound().artistFound = data.artistFound;
		this.getRound().time = data.time;
		if(data.track)
			this.getRound().track = data.track;
		
		this.getRound().points = 0
		if(data.titleFound)
			this.getRound().points += 5;
		if(data.artistFound)
			this.getRound().points += 5;

		this.updateRounds();
	}
	onAnswerBroadcast(data: IWSGameSendEventRoundAnswerBroadcast) {
		this.logRound("Answer broadcast recieved for '" + data.player.username + "'");
		const res: IGamePlayerResult = this.getResult(data.player);
		res.points = 0;
		if(data.kind == "artistFound" || data.kind == "bothFound")
		{
			res.points += 5;
			res.artistFound = true;
		}
		if(data.kind == "titleFound" || data.kind == "bothFound")
		{
			res.points += 5;
			res.titleFound = true;
		}
		this.updateResults();
	}
	


		//Client event
	join() {
		this.log("Joining game...");
		this.send({
			...this.getSendBaseData("game_join")
		})
	}
	settingsChanged(nSettings: IGameSettings) {
		if(!this.host)
			return;
		nSettings.genres = [];
		if(!nSettings.tags)
			return;
		Object.keys(nSettings.tags).forEach((tag: string) => {
			if(!nSettings.tags)
				return;
			if(nSettings.tags[tag])
				nSettings.genres.push(tag);
		})
		this.log("Updating settings...");
		this.send({
			...this.getSendBaseData("settings_update"),
			settings: nSettings,
		} as IWSGameRCVEventSettings)
	}
	start() {
		if(!this.host)
			return;
		this.log("Starting game...");
		this.send({
			...this.getSendBaseData("game_start")
		})
		this.status.phase = "started";
		this.updateStatus();
	}
	submitAnswer(answer: string) {
		this.logRound("Sending answer: '" + answer + "'")
		const time = (Date.now() - this.status.keyTime) / 1000
		this.rounds[this.status.round].answers.push({
			validated: false,
			message: answer,
			time,
			titleFound: false,
			artistFound: false
		})
		this.updateRounds();
		this.send({
			...this.getSendBaseData("answer_submit"),
			event: "answer_submit",
			answer: answer,
			time
		} as IWSGameRCVEventAnswer)
	}

	


	//====================== FUNCTIONS ======================
		//--------------------- Update ---------------------
	updateAll() {
		this.updateStatus();
		this.updateSettings();
		this.updateRounds();
		this.updatePlayers();
		this.updateResults();
		this.updateVolume();
	}
	updateStatus() {
		this.status = structuredClone(this.status);
		this.callbacks.setStatus(this.status);
	}
	updateSettings() {
		if(!this.settings)
		{
			this.callbacks.setSettings(undefined);
			return;
		}
		if(this.settings.genres.length > 0)
		{
			this.settings.tags = {};
			MUSIC_TAGS.forEach((tag: string) => {
				if(!this.settings || !this.settings.tags)
					return;
				this.settings.tags[tag] = this.settings.genres.find((tagSearch: string) => tagSearch == tag) ? true : false;
			})
		}
		else
			this.settings.tags = undefined;
		this.settings = structuredClone(this.settings);
		this.callbacks.setSettings(this.settings);
	}
	updateRounds() {
		this.rounds = structuredClone(this.rounds);
		this.callbacks.setRounds(this.rounds);
	}
	updatePlayers() {
		this.players.forEach((player: IGamePlayer) => {
			if(player.colorid == undefined)
			{
				player.colorid = this.lastColorId % 10
				this.lastColorId++;
			}
			player.host = player.user.uid == this.host?.uid
			player.self = player.user.uid == this.self?.uid
		})
		this.players = structuredClone(this.players);
		this.callbacks.setPlayers(this.players);
	}
	updateResults() {
		this.roundResult = structuredClone(this.roundResult);
		this.callbacks.setResults(this.roundResult);
	}
	updateVolume() {
		this.callbacks.setVolume(this.volume);
	}

		//--------------------- WS ---------------------
	send(data: IWSGameRCVEvent) {
		if(!this.check)
			return;
		this.callbacks.sendMessage(JSON.stringify(data));
	}
	getSendBaseData(event: IWSGameEventRcvList): IWSGameRCVEvent {
		return {
			target: "game",
			event,
			uid: this.uid,
		}
	}
	rcv(event: IWSGameSendEvent) {
		if(event.target != "game")
			return;
		switch(event.event)
		{
			case "player_joined":
				this.onPlayerJoined(event as IWSGameSendEventPlayerManage)
				break;
			case "player_left":
				this.onPlayerLeft(event as IWSGameSendEventPlayerManage)
				break;
			case "game_info":
				this.onGameJoined(event as IWSGameSendEventGameInfo)
				break;
			case "settings_updated":
				this.onSettingsChanged(event as IWSGameSendEventSettings)
				break;
			case "game_started":
				this.onGameStart(event as IWSGameSendEventSettings)
				break;
			case "round_preview":
				this.onPreviewRecieve(event as IWSGameSendEventRoundStart)
				break;
			case "round_started":
				this.onRoundStart(event as IWSGameSendEventRoundStart)
				break;
			case "answer_validation":
				this.onAnswerValidation(event as IWSGameSendEventRoundAnswer)
				break;
			case "answer_broadcast":
				this.onAnswerBroadcast(event as IWSGameSendEventRoundAnswerBroadcast)
				break;
		}
	}

		//--------------------- Round Management ---------------------
	setRound(preview: string, target: number, showAlert: boolean = false): void {
		this.checkRounds();
		if(!this.rounds[target].track.preview)
		{
			if(showAlert)
				this.warnRound("Preview recieved not on time.")
			this.rounds[target].track.preview = preview;
			this.songs[target] = undefined;
		}
		if(!this.songs[target])
		{
			if(showAlert)
				this.warnRound("Song is not cached.")
			this.songs[target] = new Audio(preview);
		}
	}
	getRound(index?: number)
	{
		return this.rounds[index == undefined ? this.status.round : index];
	}
	applyWSRound(round: TWSRoundInfo) {
		const target: IGameRound | undefined = this.rounds[round.round - 1];
		if(!target)
			return;
		target.track = round.track;
		target.titleFound = round.titleFound;
		target.artistFound = round.artistFound;
		target.time = round.time;
		target.points = round.points;
	}
	checkRounds(): void {
		if(this.settings && this.rounds.length != this.settings.trackCount)
			this.rounds = [];
		if(this.rounds.length > 0 || !this.settings)
			return;
		for(let i = 0; i < this.settings.trackCount; i++) 
			this.rounds.push({
				track: {},
				phase: "not-done",
				titleFound: false,
				artistFound: false,
				points: 0,
				time: -1,
				answers: [],
			})
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
	
		//--------------------- Sounds ---------------------
	changeVolume(value: number)
	{
		this.volume = value;
		this.songs.forEach((el: HTMLAudioElement | undefined) => {
			if(!el)
				return;
			el.volume = value / 100;
		});
		this.updateVolume();
	}

		//--------------------- Check ---------------------
	check(): boolean {
		if(this.uid == "")
			return false;
		return true;
	}

		//--------------------- LOGs ---------------------
	log(MSG: string, ...Styling: string[]){
		console.log("[%cGAME%c]: " + MSG, "font-weight: 900; color: #2083d4", "font-weight: 400; color: white", ...Styling);
	}	
	logRound(MSG: string, ...Styling: string[]){
		this.log("%c(Round: %c" + (this.status.round + 1) + "%c / %c" + (!this.settings ? "?" : this.settings.trackCount) + "%c)%c - " + MSG, 
			"font-weight: 900", 
			"font-weight: 900; color: #0fbedd", 
			"font-weight: 900; color: white", 
			"font-weight: 900; color: #728bdd", 
			"font-weight: 900; color: white",  
			"font-weight: 400", 
			...Styling
		)
	}
	warn(MSG: string, ...Styling: string[]){
		this.log("%c" + MSG + "%c", "color: #ffbb00; font-weight:900", "color: white; font-weight:400", ...Styling);
	}	
	warnRound(MSG: string, ...Styling: string[]){
		this.logRound("%c" + MSG + "%c", "color: #ffbb00; font-weight:900", "color: white; font-weight:400", ...Styling);
	}
}





























//====================== PLAYER LISTS ======================
export const gameOnPlayerJoin = (
	Game: IGameData,
	Player: IGamePlayer,
	setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>,
) => {
	if (Game.players.find((local: IGamePlayer) => local.user.uid == Player.user.uid)) return;
	Game.players.push(Player);
	Game.players = structuredClone(Game.players);
	setUsers(Game.players);
};

export const gameOnPlayerLeave = (
	Game: IGameData,
	Player: IGamePlayer,
	setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>,
) => {
	const found: number = Game.players.findIndex(
		(local: IGamePlayer) => local.user.uid == Player.user.uid,
	);
	if (found == -1) return;
	Game.players.splice(found, 1);
	Game.players = structuredClone(Game.players);
	setUsers(Game.players);
};

export const gameOnPlayerUpdate = (
	Game: IGameData,
	Players: IGamePlayer[],
	setUsers: React.Dispatch<React.SetStateAction<IGamePlayer[]>>,
) => {
	Game.players = structuredClone(Players);
	setUsers(Game.players);
};

export const gameOnMessageNew = (
	Game: IGameData,
	Message: IGameChatMsg,
	setChat: React.Dispatch<React.SetStateAction<IGameChatMsg[]>>,
) => {
	if (Game.chat.find((msg: IGameChatMsg) => msg.messageuid == Message.messageuid)) return;
	Game.chat.push(Message);
	Game.chat = structuredClone(Game.chat);
	setChat(structuredClone(Game.chat).reverse());
};

export const gameOnMessageUpdate = (
	Game: IGameData,
	Message: IGameChatMsg[],
	setChat: React.Dispatch<React.SetStateAction<IGameChatMsg[]>>,
) => {
	Game.chat = structuredClone(Message);
	setChat(structuredClone(Game.chat).reverse());
};

export const gameOnSettingsUpdate = (
	Game: IGameData,
	Settings: IGameSettings,
	setSettings: React.Dispatch<React.SetStateAction<IGameSettings | undefined>>,
) => {
	Game.settings = structuredClone(Settings);
	setSettings(Game.settings);
};

//--------------------------------------------------
//                     UTILS
//--------------------------------------------------
export const gameThemeCount = (tags: Record<string, boolean>): number => {
	let count: number = 0;
	Object.keys(tags).forEach((key: string) => {
		if (tags[key]) count++;
	});
	return count;
};