import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "../mock/server";
import { resetMockDb } from "../mock/db";
import type { ReactNode } from "react";

vi.mock("../localization/localization", () => {
	const translations: Record<string, string> = {
		LEADERBOARD: "Leaderboard",
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
		NOTIF_AGO_DAYS: "NOTIF_AGO_DAYS COUNT: {COUNT}",
		NOTIF_AGO_HOURS: "NOTIF_AGO_HOURS COUNT: {COUNT}",
		NOTIF_AGO_MINUTES: "NOTIF_AGO_MINUTES COUNT: {COUNT}",
		GAME_JOINED_MESSAGE: "{PLAYER} has joined the game.",
		GAME_LEAVED_MESSAGE: "{PLAYER} has left the game.",
		GAME_GUESSED_MESSAGE: "{PLAYER} tried: {GUESS}",
		GAME_FOUND_MESSAGE: "{PLAYER} made a correct guess",
		GAME_WAITING_START: "Waiting {USER} to start the game",
		GAME_WAITING_START_NO_HOST: "Waiting to start the game",
		GAME_PLAYER_COUNT: "Players: {COUNT} / {MAX}",
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
	const ttrfn = (id: string, params: Record<string, ReactNode>): ReactNode[] => {
		const text: string = ttr(id);
		const reg: RegExp = new RegExp(/([^{}]*)\{(.+?)\}([^{}]*)/gm);
		const out: ReactNode[] = [];

		let array: RegExpExecArray | null = null;
		while ((array = reg.exec(text)) !== null) {
			if (array.length != 4) continue;
			out.push(array[1]);
			out.push(params[array[2]]);
			out.push(array[3]);
		}
		return out;
	};

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
		ttr,
		ttrf,
		ttrd,
		ttrn,
		ttrfn,
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
