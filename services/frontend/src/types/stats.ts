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
