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
	};

	const ttr = (id: string) => translations[id] ?? id;
	const ttrf = (id: string, params: Record<string, string>) => {
		let text = ttr(id);
		for (const [key, value] of Object.entries(params)) {
			text = text.replaceAll(`{${key}}`, String(value));
		}
		return text;
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
