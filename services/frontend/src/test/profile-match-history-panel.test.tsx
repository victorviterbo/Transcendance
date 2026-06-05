import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PProfileMatchHistoryPanel from "../pages/PProfilePage/PProfileMatchHistoryPanel";
import type { IHistoryResponse } from "../types/stats";

const fetchHistoryMock = vi.fn();

vi.mock("../api/stats", () => ({
	fetchHistory: (...args: unknown[]) => fetchHistoryMock(...args),
}));

vi.mock("../pages/PProfilePage/PProfileMatchHistoryAccordionCard", () => ({
	default: ({ entry }: { entry: { roomTitle: string } }) => <div>{entry.roomTitle}</div>,
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

const createHistoryResponse = (overrides: Partial<IHistoryResponse> = {}): IHistoryResponse => ({
	history: [
		{
			playedAt: "2026-04-10T20:15:00Z",
			xpEarned: 52,
			ranking: 1,
			roomTitle: "Late Night Classics",
			tags: ["TAG_POP", "TAG_ROCK"],
			players: [
				{ username: "john", avatar: "/john.jpg", ranking: 1 },
				{ username: "luna", avatar: "/luna.jpg", ranking: 2 },
			],
			rounds: [
				{
					trackName: "The Chain",
					trackArtist: "Fleetwood Mac",
					songFound: false,
					artistFound: true,
					time: 4.8,
					ranking: 2,
					previewUrl: "https://cdn.example.test/previews/the-chain",
					artworkUrl: "https://cdn.example.test/artworks/fleetwood-mac-the-chain",
					roundNumber: 1,
				},
			],
		},
	],
	historyCount: 1,
	...overrides,
});

describe("PProfileMatchHistoryPanel", () => {
	beforeEach(() => {
		fetchHistoryMock.mockReset();
	});

	it("shows a loading state while history is being fetched", () => {
		const deferred = createDeferred<IHistoryResponse>();
		fetchHistoryMock.mockReturnValue(deferred.promise);

		render(<PProfileMatchHistoryPanel />);

		expect(fetchHistoryMock).toHaveBeenCalledTimes(1);
		expect(screen.getByText("Loading match history...")).toBeInTheDocument();
	});

	it("renders the optional title", () => {
		const deferred = createDeferred<IHistoryResponse>();
		fetchHistoryMock.mockReturnValue(deferred.promise);

		render(<PProfileMatchHistoryPanel title="PROFILE_MATCH_HISTORY" />);

		expect(screen.getByText("PROFILE_MATCH_HISTORY")).toBeInTheDocument();
	});

	it("renders fetched history entries", async () => {
		fetchHistoryMock.mockResolvedValue(createHistoryResponse());

		render(<PProfileMatchHistoryPanel />);

		expect(await screen.findByText("Late Night Classics")).toBeInTheDocument();
	});

	it("renders every fetched history entry", async () => {
		fetchHistoryMock.mockResolvedValue(
			createHistoryResponse({
				history: [
					createHistoryResponse().history[0],
					{
						playedAt: "2026-04-11T20:15:00Z",
						xpEarned: 71,
						ranking: 2,
						roomTitle: "French Touch Session",
						tags: ["TAG_ELECRO"],
						players: [{ username: "john", avatar: "/john.jpg", ranking: 2 }],
						rounds: [
							{
								trackName: "One More Time",
								trackArtist: "Daft Punk",
								songFound: true,
								artistFound: true,
								time: 2.2,
								ranking: 1,
								previewUrl: "https://cdn.example.test/previews/one-more-time",
								artworkUrl: "https://cdn.example.test/artworks/one-more-time",
								roundNumber: 1,
							},
						],
					},
				],
				historyCount: 2,
			}),
		);

		render(<PProfileMatchHistoryPanel />);

		expect(await screen.findByText("Late Night Classics")).toBeInTheDocument();
		expect(screen.getByText("French Touch Session")).toBeInTheDocument();
	});

	it("renders the empty message when the history is empty", async () => {
		fetchHistoryMock.mockResolvedValue(createHistoryResponse({ history: [], historyCount: 0 }));

		render(<PProfileMatchHistoryPanel emptyMessage="HISTORY_EMPTY" />);

		expect(await screen.findByText("No matches to show yet.")).toBeInTheDocument();
	});

	it("renders a custom empty message key when provided", async () => {
		fetchHistoryMock.mockResolvedValue(createHistoryResponse({ history: [], historyCount: 0 }));

		render(<PProfileMatchHistoryPanel emptyMessage="PROFILE_STATS_LOAD_FAILED" />);

		expect(await screen.findByText("Statistics loading failed")).toBeInTheDocument();
	});

	it("renders the API error message when fetching history fails", async () => {
		fetchHistoryMock.mockRejectedValue({
			response: {
				status: 401,
				data: {
					error: {
						auth: "UNAUTHORIZED",
					},
				},
			},
		});

		render(<PProfileMatchHistoryPanel />);

		expect(await screen.findByText("UNAUTHORIZED")).toBeInTheDocument();
	});

	it("falls back to the generic error message when the failure has no API message", async () => {
		fetchHistoryMock.mockRejectedValue({});

		render(<PProfileMatchHistoryPanel />);

		expect(await screen.findByText("Match history loading failed")).toBeInTheDocument();
	});
});
