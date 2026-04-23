import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MUSIC_TAGS } from "../constants";
import ProfileStatisticsPanel from "../pages/PProfilePage/PProfileStatisticsPanel";
import type { IGlobalStatsResponse } from "../types/stats";

const fetchGlobalStatsMock = vi.fn();

vi.mock("../api/stats", () => ({
	fetchGlobalStats: (...args: unknown[]) => fetchGlobalStatsMock(...args),
}));

vi.mock("@mui/icons-material/SportsEsports", () => ({
	default: () => <div>ICON_GAMES</div>,
}));
vi.mock("@mui/icons-material/QueueMusic", () => ({
	default: () => <div>ICON_SONGS</div>,
}));
vi.mock("@mui/icons-material/EmojiEvents", () => ({
	default: () => <div>ICON_WINS</div>,
}));
vi.mock("@mui/icons-material/Star", () => ({
	default: () => <div>ICON_SCORE</div>,
}));
vi.mock("@mui/icons-material/Timer", () => ({
	default: () => <div>ICON_TIME</div>,
}));
vi.mock("@mui/icons-material/Leaderboard", () => ({
	default: () => <div>ICON_RANKING</div>,
}));
vi.mock("@mui/icons-material/Mic", () => ({
	default: () => <div>ICON_ARTIST</div>,
}));
vi.mock("@mui/icons-material/Audiotrack", () => ({
	default: () => <div>ICON_SONG</div>,
}));
vi.mock("@mui/icons-material/LibraryMusic", () => ({
	default: () => <div>ICON_COMPLETE</div>,
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

const createStats = (overrides: Partial<IGlobalStatsResponse> = {}): IGlobalStatsResponse => ({
	averageScore: 48,
	xp: 654,
	totalGamesPlayed: 35,
	totalSongsPlayed: 468,
	totalGamesWon: 5,
	ranking: 3,
	totalPlayers: 1687,
	averageTime: 3.2,
	successRateArtist: 23.6,
	successRateSong: 39.7,
	successRateComplete: 45.7,
	successRatesCompleteByTag: {
		TAG_POP: 12.5,
		TAG_ROCK: 65.3,
		TAG_RAP: 22.1,
		TAG_ELECRO: 54.4,
		TAG_FRENCH_VARIETY: 11.2,
		TAG_RNB: 8.4,
	},
	...overrides,
});

const musicTagLabels: Record<(typeof MUSIC_TAGS)[number], string> = {
	TAG_POP: "Pop",
	TAG_RAP: "Rap",
	TAG_ROCK: "Rock",
	TAG_ELECRO: "Elecro",
	TAG_FRENCH_VARIETY: "French Variety",
	TAG_RNB: "RNB",
};

const getStatisticCard = (label: string) => {
	const labelElement = screen.getByText(label);
	const cardElement = labelElement.parentElement?.parentElement;
	if (!cardElement) throw new Error(`Missing statistic card for label: ${label}`);
	return cardElement;
};

describe("ProfileStatisticsPanel", () => {
	beforeEach(() => {
		fetchGlobalStatsMock.mockReset();
	});

	it("shows a loading state while stats are being fetched", () => {
		const deferred = createDeferred<IGlobalStatsResponse>();
		fetchGlobalStatsMock.mockReturnValue(deferred.promise);

		render(<ProfileStatisticsPanel username="john" />);

		expect(fetchGlobalStatsMock).toHaveBeenCalledWith("john");
		expect(screen.getByText("Loading statistics...")).toBeInTheDocument();
	});

	it("renders the optional title", () => {
		const deferred = createDeferred<IGlobalStatsResponse>();
		fetchGlobalStatsMock.mockReturnValue(deferred.promise);

		render(<ProfileStatisticsPanel username="john" title="PROFILE_STATISTICS" />);

		expect(screen.getByText("PROFILE_STATISTICS")).toBeInTheDocument();
	});

	it("renders the fetched profile statistics and supported tag labels", async () => {
		fetchGlobalStatsMock.mockResolvedValue(createStats());

		render(<ProfileStatisticsPanel username="john" />);

		expect(await screen.findByText("Games played")).toBeInTheDocument();
		expect(screen.getByText("35")).toBeInTheDocument();
		expect(screen.getByText("468")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("Average score")).toBeInTheDocument();
		expect(screen.getByText("48")).toBeInTheDocument();
		expect(within(getStatisticCard("Ranking")).getByText("3 / 1,687")).toBeInTheDocument();
		expect(screen.getByText("3.2s")).toBeInTheDocument();
		expect(screen.getByText("45.7%")).toBeInTheDocument();
		expect(screen.getByText("23.6%")).toBeInTheDocument();
		expect(screen.getByText("39.7%")).toBeInTheDocument();
		expect(screen.getByText("Complete Rates By Tag")).toBeInTheDocument();
		expect(screen.getByText("Rock")).toBeInTheDocument();
		expect(screen.getByText("Rap")).toBeInTheDocument();
		expect(screen.getByText("Elecro")).toBeInTheDocument();
		expect(screen.getByText("French Variety")).toBeInTheDocument();
		expect(screen.getByText("RNB")).toBeInTheDocument();
	});

	it("renders all music tags with 0.0% when tag statistics are missing", async () => {
		fetchGlobalStatsMock.mockResolvedValue(
			createStats({
				successRatesCompleteByTag: {},
			}),
		);

		render(<ProfileStatisticsPanel username="john" />);

		expect(await screen.findByText("Complete Rates By Tag")).toBeInTheDocument();
		for (const tag of MUSIC_TAGS) {
			expect(screen.getByText(musicTagLabels[tag])).toBeInTheDocument();
		}
		expect(screen.getAllByText("0.0%")).toHaveLength(MUSIC_TAGS.length);
	});

	it("fills missing tag values with 0.0% when the payload is partial", async () => {
		fetchGlobalStatsMock.mockResolvedValue(
			createStats({
				successRatesCompleteByTag: {
					TAG_POP: 12.5,
				},
			}),
		);

		render(<ProfileStatisticsPanel username="john" />);

		expect(await screen.findByText("Pop")).toBeInTheDocument();
		expect(screen.getByText("12.5%")).toBeInTheDocument();
		expect(screen.getAllByText("0.0%")).toHaveLength(MUSIC_TAGS.length - 1);
	});

	it("renders the API error message when fetching statistics fails", async () => {
		fetchGlobalStatsMock.mockRejectedValue({
			response: {
				status: 400,
				data: {
					error: {
						query: "USER_NOT_FOUND",
					},
				},
			},
		});

		render(<ProfileStatisticsPanel username="ghost" />);

		expect(await screen.findByText("USER_NOT_FOUND")).toBeInTheDocument();
	});

	it("falls back to the generic translated error when the failure has no API message", async () => {
		fetchGlobalStatsMock.mockRejectedValue({});

		render(<ProfileStatisticsPanel username="ghost" />);

		expect(await screen.findByText("Statistics loading failed")).toBeInTheDocument();
	});

	it("refetches and updates when the username changes", async () => {
		fetchGlobalStatsMock
			.mockResolvedValueOnce(createStats({ totalGamesPlayed: 35, ranking: 3 }))
			.mockResolvedValueOnce(createStats({ totalGamesPlayed: 91, ranking: 14 }));

		const { rerender } = render(<ProfileStatisticsPanel username="john" />);

		expect(await screen.findByText("35")).toBeInTheDocument();
		expect(within(getStatisticCard("Ranking")).getByText("3 / 1,687")).toBeInTheDocument();

		rerender(<ProfileStatisticsPanel username="marc" />);

		expect(fetchGlobalStatsMock).toHaveBeenCalledWith("marc");
		expect(await screen.findByText("91")).toBeInTheDocument();
		expect(within(getStatisticCard("Ranking")).getByText("14 / 1,687")).toBeInTheDocument();
		expect(
			within(getStatisticCard("Ranking")).queryByText("3 / 1,687"),
		).not.toBeInTheDocument();
	});

	it("does not fetch stats when no username is provided", () => {
		render(<ProfileStatisticsPanel username="" />);

		expect(fetchGlobalStatsMock).not.toHaveBeenCalled();
		expect(screen.queryByText("Loading statistics...")).not.toBeInTheDocument();
	});
});
