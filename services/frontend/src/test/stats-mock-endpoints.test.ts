import { describe, expect, it } from "vitest";
import api from "../api";
import { API_STATS_GLOBAL, API_STATS_HISTORY, API_STATS_LEADERBOARD } from "../constants";
import { db } from "../mock/db";

describe("stats mock endpoints", () => {
	it("requires authentication for aggregated stats", async () => {
		await expect(api.get(`${API_STATS_GLOBAL}?q=john`)).rejects.toMatchObject({
			response: {
				status: 401,
				data: {
					error: {
						auth: "UNAUTHORIZED",
					},
				},
			},
		});
	});

	it("returns aggregated stats for an exact username lookup", async () => {
		db.setSessionUser("john");
		db.createUser("alice", "alice@42.fr", "Secret1!");
		db.setUserExpPoints("alice", 450);

		const response = await api.get(`${API_STATS_GLOBAL}?q=john`);

		expect(response.status).toBe(200);
		expect(response.data).toMatchObject({
			xp: 120,
			ranking: 15,
			totalPlayers: 16,
		});
		expect(response.data.averageScore).toEqual(expect.any(Number));
		expect(response.data.average_score).toBeUndefined();
		expect(response.data.successRatesCompleteByTag.TAG_POP).toEqual(expect.any(Number));
	});

	it("rejects missing global stats query parameters", async () => {
		db.setSessionUser("john");

		await expect(api.get(API_STATS_GLOBAL)).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						query: "MISSING_FIELD",
					},
				},
			},
		});
	});

	it("requires authentication for the leaderboard", async () => {
		await expect(api.get(API_STATS_LEADERBOARD)).rejects.toMatchObject({
			response: {
				status: 401,
				data: {
					error: {
						auth: "UNAUTHORIZED",
					},
				},
			},
		});
	});

	it("returns the leaderboard sorted by xp and flags the current user", async () => {
		db.createUser("alice", "alice@42.fr", "Secret1!");
		db.createUser("bob", "bob@42.fr", "Secret1!");
		db.setUserExpPoints("alice", 5000);
		db.setUserExpPoints("bob", 30);
		db.setSessionUser("john");

		const response = await api.get(API_STATS_LEADERBOARD);

		expect(response.status).toBe(200);
		expect(response.data.leaderboardCount).toBe(11);
		expect(response.data.totalNumberPlayer).toBe(17);
		expect(response.data.ranking).toBe(15);
		expect(response.data.leaderboard[0]).toMatchObject({ username: "alice", ranking: 1 });
		expect(response.data.leaderboard.at(-1)).toMatchObject({
			username: "john",
			ranking: 15,
			isCurrentUser: true,
		});
		expect(
			response.data.leaderboard.some(
				(entry: { username: string; isCurrentUser: boolean }) =>
					entry.username === "john" && entry.isCurrentUser,
			),
		).toBe(true);
	});

	it("requires authentication for match history", async () => {
		await expect(api.get(API_STATS_HISTORY)).rejects.toMatchObject({
			response: {
				status: 401,
				data: {
					error: {
						auth: "UNAUTHORIZED",
					},
				},
			},
		});
	});

	it("returns the authenticated user's match history", async () => {
		db.setSessionUser("john");

		const response = await api.get(API_STATS_HISTORY);

		expect(response.status).toBe(200);
		expect(response.data.historyCount).toBe(response.data.history.length);
		expect(response.data.history[0].playedAt).toContain("T");
		expect(response.data.history[0].players).toEqual(
			expect.arrayContaining([expect.objectContaining({ username: "john" })]),
		);
		expect(
			response.data.history.map((entry: { rounds: unknown[] }) => entry.rounds.length),
		).toEqual([10, 5, 15]);
		expect(response.data.leaderboard).toBeUndefined();
	});

	it("returns an empty history payload for users without seeded matches", async () => {
		db.setSessionUser("enzo");

		const response = await api.get(API_STATS_HISTORY);

		expect(response.status).toBe(200);
		expect(response.data).toEqual({
			history: [],
			historyCount: 0,
		});
	});
});
