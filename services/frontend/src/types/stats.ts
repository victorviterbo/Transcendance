export interface IGlobalStatsResponse {
	averageScore: number;
	xp: number;
	totalGamesPlayed: number;
	totalTitlesPlayed: number;
	totalGamesWon: number;
	ranking: number;
	totalPlayers: number;
	averageTime: number;
	successRateArtist: number;
	successRateTitle: number;
	successRateComplete: number;
	successRatesCompleteByTag: Record<string, number>;
}

export interface ILeaderboardEntry {
	username: string;
	avatar: string;
	xp: number;
	badges: string;
	ranking: number;
	isCurrentUser: boolean;
}

export interface ILeaderboardResponse {
	leaderboard: ILeaderboardEntry[];
	leaderboardCount: number;
	ranking: number;
	totalNumberPlayer: number;
}

export interface IHistoryPlayer {
	username: string;
	avatar: string;
	ranking: number;
}

export interface IHistoryRound {
	trackName: string;
	trackArtist: string;
	titleFound: boolean;
	artistFound: boolean;
	time: number;
	ranking: number;
	previewUrl: string;
	artworkUrl: string;
	roundNumber: number;
}

export interface IHistoryEntry {
	playedAt: string;
	xpEarned: number;
	ranking: number;
	roomTitle: string;
	tags: string[];
	players: IHistoryPlayer[];
	rounds: IHistoryRound[];
}

export interface IHistoryResponse {
	history: IHistoryEntry[];
	historyCount: number;
}
