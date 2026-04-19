import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PProfileMatchHistoryDrawerCard from "../pages/PProfilePage/PProfileMatchHistoryDrawerCard";
import type { IHistoryEntry } from "../types/stats";

const navigateMock = vi.fn();

vi.mock("../api/profile", () => ({
	resolveProfileImage: () => undefined,
}));

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

const createEntry = (overrides: Partial<IHistoryEntry> = {}): IHistoryEntry => ({
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
		{
			trackName: "Levitating",
			trackArtist: "Dua Lipa",
			songFound: true,
			artistFound: true,
			time: 2.4,
			ranking: 1,
			previewUrl: "https://cdn.example.test/previews/levitating",
			artworkUrl: "https://cdn.example.test/artworks/dua-lipa-levitating",
			roundNumber: 2,
		},
	],
	...overrides,
});

describe("PProfileMatchHistoryDrawerCard", () => {
	it("renders the closed summary card with room title in the header", () => {
		render(<PProfileMatchHistoryDrawerCard entry={createEntry()} />);

		expect(screen.getByText("Late Night Classics")).toBeInTheDocument();
		expect(screen.getByText("Apr 10, 2026")).toBeInTheDocument();
		expect(screen.getByText("Score: 52")).toBeInTheDocument();
		expect(screen.getByText("Rank: 1 / 2")).toBeInTheDocument();
		expect(screen.getByText("Pop")).toBeInTheDocument();
		expect(screen.getByText("Rock")).toBeInTheDocument();
	});

	it("shows the rounds and players tabs when expanded", () => {
		render(<PProfileMatchHistoryDrawerCard entry={createEntry()} />);

		fireEvent.click(screen.getByRole("button", { expanded: false }));

		expect(screen.getByText("Rounds")).toBeInTheDocument();
		expect(screen.getByText("Players")).toBeInTheDocument();
	});

	it("keeps round details hidden while collapsed", () => {
		render(<PProfileMatchHistoryDrawerCard entry={createEntry()} />);

		expect(screen.queryByText("Fleetwood Mac")).not.toBeInTheDocument();
		expect(screen.queryByText("john")).not.toBeInTheDocument();
	});

	it("expands and shows rounds by default", () => {
		render(
			<PProfileMatchHistoryDrawerCard
				entry={createEntry({
					rounds: [
						{
							trackName: "The Chain",
							trackArtist: "Fleetwood Mac",
							songFound: true,
							artistFound: true,
							time: 4.8,
							ranking: 2,
							previewUrl: "https://cdn.example.test/previews/the-chain",
							artworkUrl:
								"https://cdn.example.test/artworks/fleetwood-mac-the-chain",
							roundNumber: 1,
						},
					],
				})}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { expanded: false }));

		expect(screen.getAllByText("Score: 52")).toHaveLength(2);
		expect(screen.getByText("Fleetwood Mac")).toBeInTheDocument();
		expect(screen.getByText("The Chain")).toBeInTheDocument();
		expect(screen.getByText("4.8s")).toBeInTheDocument();
	});

	it("renders every tag in the summary", () => {
		render(
			<PProfileMatchHistoryDrawerCard
				entry={createEntry({
					tags: [
						"TAG_POP",
						"TAG_RAP",
						"TAG_ROCK",
						"TAG_ELECRO",
						"TAG_FRENCH_VARIETY",
						"TAG_RNB",
					],
				})}
			/>,
		);

		expect(screen.getByText("Pop")).toBeInTheDocument();
		expect(screen.getByText("Rap")).toBeInTheDocument();
		expect(screen.getByText("Rock")).toBeInTheDocument();
		expect(screen.getByText("Elecro")).toBeInTheDocument();
		expect(screen.getByText("French Variety")).toBeInTheDocument();
		expect(screen.getByText("RNB")).toBeInTheDocument();
	});

	it("switches to the players tab and navigates when a player name is clicked", () => {
		navigateMock.mockReset();
		render(<PProfileMatchHistoryDrawerCard entry={createEntry()} />);

		fireEvent.click(screen.getByRole("button", { expanded: false }));
		fireEvent.click(screen.getByRole("tab", { name: "Players" }));
		fireEvent.click(screen.getByRole("button", { name: "john" }));

		expect(screen.getByText("john")).toBeInTheDocument();
		expect(screen.getByText("Rank: 1")).toBeInTheDocument();
		expect(navigateMock).toHaveBeenCalledWith("/users/john");
	});

	it("shows every player once the players tab is selected", () => {
		render(<PProfileMatchHistoryDrawerCard entry={createEntry()} />);

		fireEvent.click(screen.getByRole("button", { expanded: false }));
		fireEvent.click(screen.getByRole("tab", { name: "Players" }));

		expect(screen.getByText("john")).toBeInTheDocument();
		expect(screen.getByText("luna")).toBeInTheDocument();
		expect(screen.getByText("Rank: 1")).toBeInTheDocument();
		expect(screen.getByText("Rank: 2")).toBeInTheDocument();
	});

	it("navigates when a player avatar is clicked", () => {
		navigateMock.mockReset();
		render(<PProfileMatchHistoryDrawerCard entry={createEntry()} />);

		fireEvent.click(screen.getByRole("button", { expanded: false }));
		fireEvent.click(screen.getByRole("tab", { name: "Players" }));
		fireEvent.click(screen.getByRole("button", { name: "Open profile john" }));

		expect(navigateMock).toHaveBeenCalledWith("/users/john");
	});
});
