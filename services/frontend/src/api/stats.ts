import api from "./client";
import { API_STATS_GLOBAL, API_STATS_LEADERBOARD } from "../constants";
import type { IGlobalStatsResponse, ILeaderboardResponse } from "../types/stats";

export const fetchGlobalStats = async (username: string): Promise<IGlobalStatsResponse> => {
	const response = await api.get<IGlobalStatsResponse>(API_STATS_GLOBAL, {
		params: { q: username },
	});
	return response.data;
};

export const fetchLeaderboard = async (): Promise<ILeaderboardResponse> => {
	const response = await api.get<ILeaderboardResponse>(API_STATS_LEADERBOARD);
	return response.data;
};
