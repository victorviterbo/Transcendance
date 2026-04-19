import api from "./client";
import { API_STATS_GLOBAL, API_STATS_HISTORY, API_STATS_LEADERBOARD } from "../constants";
import type {
	IGlobalStatsResponse,
	IHistoryResponse,
	ILeaderboardResponse,
} from "../types/stats";

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

export const fetchHistory = async (): Promise<IHistoryResponse> => {
	const response = await api.get<IHistoryResponse>(API_STATS_HISTORY);
	return response.data;
};
