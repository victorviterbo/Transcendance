import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "../mock/server";
import { resetMockDb } from "../mock/db";

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
