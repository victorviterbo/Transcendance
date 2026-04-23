import { http, HttpResponse } from "msw";
import { API_STATS_GLOBAL, API_STATS_HISTORY, API_STATS_LEADERBOARD } from "../../constants";
import { db } from "../db";

const unauthorized = () =>
	HttpResponse.json(
		{
			error: {
				auth: "UNAUTHORIZED",
			},
		},
		{ status: 401 },
	);

export const StatsGlobalHandler = http.get(API_STATS_GLOBAL, ({ request }) => {
	const sessionUser = db.getSessionUser();
	if (!sessionUser) return unauthorized();

	const url = new URL(request.url);
	const query = url.searchParams.get("q");

	if (query === null || query.length === 0) {
		return HttpResponse.json({ error: { query: "MISSING_FIELD" } }, { status: 400 });
	}

	const payload = db.getGlobalStats(query);
	if (!payload) {
		return HttpResponse.json({ error: { query: "USER_NOT_FOUND" } }, { status: 400 });
	}

	return HttpResponse.json(payload, { status: 200 });
});

export const StatsLeaderboardHandler = http.get(API_STATS_LEADERBOARD, () => {
	const sessionUser = db.getSessionUser();
	if (!sessionUser) return unauthorized();

	return HttpResponse.json(db.getLeaderboard(sessionUser.username), { status: 200 });
});

export const StatsHistoryHandler = http.get(API_STATS_HISTORY, () => {
	const sessionUser = db.getSessionUser();
	if (!sessionUser) return unauthorized();

	const payload = db.getHistory(sessionUser.username);
	if (!payload) return unauthorized();

	return HttpResponse.json(payload, { status: 200 });
});
