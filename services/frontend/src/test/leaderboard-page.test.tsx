import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PLeaderboardPage from "../pages/PLeaderboardPage";
import type { ILeaderboardEntry, ILeaderboardResponse } from "../types/stats";

const fetchLeaderboardMock = vi.fn();

vi.mock("../api/stats", () => ({
	fetchLeaderboard: (...args: unknown[]) => fetchLeaderboardMock(...args),
}));

vi.mock("../api/profile", () => ({
	resolveProfileImage: () => undefined,
}));

vi.mock("../pages/common/GPageBases", () => ({
	default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

const createDeferred = <T,>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((nextResolve, nextReject) => {
		resolve = nextResolve;
		reject = nextReject;
	});
	return { promise, resolve, reject };
};

const createEntry = (overrides: Partial<ILeaderboardEntry> = {}): ILeaderboardEntry => ({
	username: "alice",
	avatar: "/DB/media/default_pp.jpg",
	xp: 450,
	badges: "Attentive Owl",
	ranking: 1,
	isCurrentUser: false,
	...overrides,
});

const createResponse = (
	overrides: Partial<ILeaderboardResponse> = {},
): ILeaderboardResponse => ({
	leaderboard: [createEntry()],
	leaderboardCount: 1,
	ranking: 1,
	totalNumberPlayer: 1,
	...overrides,
});

const renderPage = () =>
	render(
		<MemoryRouter>
			<PLeaderboardPage />
		</MemoryRouter>,
	);

describe("PLeaderboardPage", () => {
	beforeEach(() => {
		fetchLeaderboardMock.mockReset();
	});

	it("shows the page title and loading state while the leaderboard request is pending", () => {
		const deferred = createDeferred<ILeaderboardResponse>();
		fetchLeaderboardMock.mockReturnValue(deferred.promise);

		renderPage();

		expect(
			screen.getByRole("heading", {
				name: "Leaderboard",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Leaderboard loading...")).toBeInTheDocument();
		expect(fetchLeaderboardMock).toHaveBeenCalledTimes(1);
		expect(screen.queryAllByTestId("leaderboard-row")).toHaveLength(0);
		expect(
			screen.queryByText("Compete with others to climb the ladder!"),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/Total players:/)).not.toBeInTheDocument();
	});

	it("renders the leaderboard message, rows, localized points labels, and total footer", async () => {
		fetchLeaderboardMock.mockResolvedValue(
			createResponse({
				leaderboard: [
					createEntry(),
					createEntry({
						username: "john",
						xp: 120,
						badges: "Dazed Jellyfish",
						ranking: 2,
						isCurrentUser: true,
					}),
				],
				leaderboardCount: 2,
				ranking: 2,
				totalNumberPlayer: 7,
			}),
		);

		renderPage();

		expect(await screen.findByText("alice")).toBeInTheDocument();
		expect(screen.getByText("john")).toBeInTheDocument();
		expect(
			screen.getByText("Compete with others to climb the ladder!"),
		).toBeInTheDocument();
		expect(screen.getByText("Total players: 7")).toBeInTheDocument();
		expect(screen.getByText("Attentive Owl")).toBeInTheDocument();
		expect(screen.getByText("Dazed Jellyfish")).toBeInTheDocument();
		expect(screen.getAllByText("Points")).toHaveLength(2);
		expect(screen.getAllByTestId("leaderboard-row")).toHaveLength(2);
	});

	it("renders the appended current-user row returned after the top players", async () => {
		fetchLeaderboardMock.mockResolvedValue(
			createResponse({
				leaderboard: [
					createEntry(),
					createEntry({
						username: "luna",
						xp: 820,
						badges: "Curious Cat",
						ranking: 2,
					}),
					createEntry({
						username: "john",
						xp: 120,
						badges: "Dazed Jellyfish",
						ranking: 14,
						isCurrentUser: true,
					}),
				],
				leaderboardCount: 3,
				ranking: 14,
				totalNumberPlayer: 15,
			}),
		);

		renderPage();

		expect(await screen.findByText("john")).toBeInTheDocument();
		const rows = screen.getAllByTestId("leaderboard-row");
		expect(rows).toHaveLength(3);

		const appendedRow = rows[2];
		expect(within(appendedRow).getByText("14")).toBeInTheDocument();
		expect(within(appendedRow).getByText("john")).toBeInTheDocument();
		expect(within(appendedRow).getByText("120")).toBeInTheDocument();
		expect(within(appendedRow).getByText("Dazed Jellyfish")).toBeInTheDocument();
		expect(screen.getByText("Total players: 15")).toBeInTheDocument();
	});

	it("renders an empty leaderboard without crashing and still shows the footer", async () => {
		fetchLeaderboardMock.mockResolvedValue(
			createResponse({
				leaderboard: [],
				leaderboardCount: 0,
				ranking: 0,
				totalNumberPlayer: 0,
			}),
		);

		renderPage();

		expect(
			await screen.findByText("Compete with others to climb the ladder!"),
		).toBeInTheDocument();
		expect(screen.queryAllByTestId("leaderboard-row")).toHaveLength(0);
		expect(screen.getByText("Total players: 0")).toBeInTheDocument();
	});

	it("renders a string error message when the leaderboard request fails", async () => {
		fetchLeaderboardMock.mockRejectedValue({
			response: {
				status: 500,
				data: { error: "Leaderboard unavailable" },
			},
		});

		renderPage();

		expect(await screen.findByText("Unable to load leaderboard")).toBeInTheDocument();
		expect(screen.getByText("Leaderboard unavailable")).toBeInTheDocument();
		expect(screen.queryAllByTestId("leaderboard-row")).toHaveLength(0);
		expect(screen.queryByText("Total players: 0")).not.toBeInTheDocument();
		expect(
			screen.queryByText("Compete with others to climb the ladder!"),
		).not.toBeInTheDocument();
	});

	it("joins structured error payload values when the leaderboard request fails", async () => {
		fetchLeaderboardMock.mockRejectedValue({
			response: {
				status: 400,
				data: {
					error: {
						username: "Username missing",
						scope: "Invalid scope",
					},
				},
			},
		});

		renderPage();

		expect(await screen.findByText("Unable to load leaderboard")).toBeInTheDocument();
		expect(screen.getByText("Username missing, Invalid scope")).toBeInTheDocument();
	});

	it("falls back to the current error code when the request fails without an API message", async () => {
		fetchLeaderboardMock.mockRejectedValue(new Error("boom"));

		renderPage();

		expect(await screen.findByText("Unable to load leaderboard")).toBeInTheDocument();
		expect(screen.getByText("LEADERBOARD_LOAD_FAILED")).toBeInTheDocument();
	});
});
