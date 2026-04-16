import api from "./client";
import { API_STATS_LEADERBOARD } from "../constants";
import type { ILeaderboardResponse } from "../types/stats";

export const fetchLeaderboard = async (): Promise<ILeaderboardResponse> => {
	const response = await api.get<ILeaderboardResponse>(API_STATS_LEADERBOARD);
	return response.data;
};
