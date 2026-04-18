import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "../mock/server";
import { resetMockDb } from "../mock/db";

vi.mock("../localization/localization", () => {
	const translations: Record<string, string> = {
		LEADERBOARD_LOADING: "Leaderboard loading...",
		LEADERBOARD_LOADING_FAILED: "Leaderboard loading failed",
		LEADERBOARD_POINTS: "Points",
		LEADERBOARD_TOTAL_PLAYERS: "Total players: {number}",
		LEADERBOARD_MESSAGE: "Compete with others to climb the ladder!",
		PROFILE_STATS_LOADING: "Loading statistics...",
		PROFILE_STATS_LOAD_FAILED: "Statistics loading failed",
		STATS_GAMES_PLAYED: "Games played",
		STATS_SONGS_PLAYED: "Songs played",
		STATS_GAMES_WON: "Games won",
		STATS_AVERAGE_SCORE: "Average score",
		STATS_AVERAGE_TIME: "Average time",
		STATS_RANKING: "Ranking",
		STATS_ARTIST_RATE: "Artist rate",
		STATS_SONG_RATE: "Song rate",
		STATS_COMPLETE_RATE: "Complete rate",
		STATS_COMPLETE_RATES_BY_TAG: "Complete Rates By Tag",
		HISTORY_LOADING: "Loading match history...",
		HISTORY_LOADING_FAILED: "Match history loading failed",
		HISTORY_EMPTY: "No matches to show yet.",
		HISTORY_SCORE: "Score: {score}",
		HISTORY_RANKING: "Rank: {rank} / {players}",
		HISTORY_PLAYER_RANKING: "Rank: {rank}",
		HISTORY_OPEN_PROFILE: "Open profile {username}",
		HISTORY_ROUNDS: "Rounds",
		HISTORY_PLAYERS: "Players",
		TAG_POP: "Pop",
		TAG_RAP: "Rap",
		TAG_ROCK: "Rock",
		TAG_ELECRO: "Elecro",
		TAG_FRENCH_VARIETY: "French Variety",
		TAG_RNB: "RNB",
	};

	const ttr = (id: string) => translations[id] ?? id;
	const ttrf = (id: string, params: Record<string, string>) => {
		let text = ttr(id);
		for (const [key, value] of Object.entries(params)) {
			text = text.replaceAll(`{${key}}`, String(value));
		}
		return text;
	};
	const ttrn = (value: number, options?: Intl.NumberFormatOptions) =>
		new Intl.NumberFormat("en-US", options).format(value);
	const ttrd = (value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat("en-US", options).format(
			value instanceof Date ? value : new Date(value),
		);

	return {
		langData: {
			headers: [],
			langs: [],
			idPos: -1,
			descPos: -1,
			totalCol: -1,
		},
		currentLang: "en",
		onLangChanged: vi.fn(),
		setOnLangChanged: vi.fn(),
		startLocalization: vi.fn(),
		ttr: (id: string) => id,
		ttrf: (id: string, params: Record<string, string>) => {
			for (const [key, value] of Object.entries(params)) {
				id += " " + key + ": " + value;
			}
			return id;
		},
		ttrd,
		ttrn,
	};
});

// Starts MSW server before all tests
beforeAll(() => {
	server.listen({ onUnhandledRequest: "error" });
});

// After each test, resets MSW handlers, mock database and cleans up DOM
afterEach(() => {
	server.resetHandlers();
	resetMockDb();
	if (typeof localStorage !== "undefined") {
		localStorage.clear();
	}
	cleanup();
});

// Closes MSW server after all the tests
afterAll(() => {
	server.close();
});

// Silences console.log to keep test output readable
vi.spyOn(console, "log").mockImplementation(() => {});
