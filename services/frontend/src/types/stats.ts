export interface IGlobalStatsResponse {
	averageScore: number;
	xp: number;
	totalGamesPlayed: number;
	totalSongsPlayed: number;
	totalGamesWon: number;
	ranking: number;
	totalPlayers: number;
	averageTime: number;
	successRateArtist: number;
	successRateSong: number;
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
