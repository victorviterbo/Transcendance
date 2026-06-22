import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PProfileMatchHistoryRoundEntry from "../pages/PProfilePage/PProfileMatchHistoryRoundEntry";
import type { IHistoryRound } from "../types/stats";

const createRound = (overrides: Partial<IHistoryRound> = {}): IHistoryRound => ({
	trackName: "The Chain",
	trackArtist: "Fleetwood Mac",
	songFound: false,
	artistFound: true,
	time: 4.8,
	ranking: 2,
	previewUrl: "https://cdn.example.test/previews/the-chain",
	artworkUrl: "https://cdn.example.test/artworks/fleetwood-mac-the-chain",
	roundNumber: 1,
	...overrides,
});

class LoadedImageMock {
	onload: (() => void) | null = null;

	set src(_value: string) {
		queueMicrotask(() => this.onload?.());
	}
}

describe("PProfileMatchHistoryRoundEntry", () => {
	beforeEach(() => {
		vi.stubGlobal("Image", LoadedImageMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders artwork, artist, title, ranking and time when the round is fully found", async () => {
		render(
			<PProfileMatchHistoryRoundEntry
				round={createRound({ songFound: true, artistFound: true })}
			/>,
		);

		expect(await screen.findByAltText("Fleetwood Mac - The Chain")).toBeInTheDocument();
		expect(screen.getByText("Fleetwood Mac")).toBeInTheDocument();
		expect(screen.getByText("The Chain")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("4.8s")).toBeInTheDocument();
		expect(screen.getByTestId("LeaderboardIcon")).toBeInTheDocument();
		expect(screen.getByTestId("AccessTimeIcon")).toBeInTheDocument();
	});

	it("hides ranking and time when the round is not fully found", () => {
		render(<PProfileMatchHistoryRoundEntry round={createRound()} />);

		expect(screen.queryByText("2")).not.toBeInTheDocument();
		expect(screen.queryByText("4.8s")).not.toBeInTheDocument();
		expect(screen.queryByTestId("LeaderboardIcon")).not.toBeInTheDocument();
		expect(screen.queryByTestId("AccessTimeIcon")).not.toBeInTheDocument();
		expect(screen.getByTestId("MicIcon")).toBeInTheDocument();
		expect(screen.getByTestId("AudiotrackIcon")).toBeInTheDocument();
		expect(screen.getAllByTestId("CircleIcon")).toHaveLength(2);
	});

	it("still shows the found status icons when both answers are missed", () => {
		render(
			<PProfileMatchHistoryRoundEntry
				round={createRound({ artistFound: false, songFound: false })}
			/>,
		);

		expect(screen.getByTestId("MicIcon")).toBeInTheDocument();
		expect(screen.getByTestId("AudiotrackIcon")).toBeInTheDocument();
		expect(screen.getAllByTestId("CircleIcon")).toHaveLength(2);
		expect(screen.queryByTestId("LeaderboardIcon")).not.toBeInTheDocument();
		expect(screen.queryByTestId("AccessTimeIcon")).not.toBeInTheDocument();
	});

	it("shows a visual placeholder when artwork fails to load", async () => {
		render(<PProfileMatchHistoryRoundEntry round={createRound()} />);

		fireEvent.error(await screen.findByAltText("Fleetwood Mac - The Chain"));

		expect(screen.getByTestId("MusicNoteIcon")).toBeInTheDocument();
	});

	it("shows a visual placeholder when artwork is missing", () => {
		render(<PProfileMatchHistoryRoundEntry round={createRound({ artworkUrl: "" })} />);

		expect(screen.getByTestId("MusicNoteIcon")).toBeInTheDocument();
		expect(screen.queryByAltText("Fleetwood Mac - The Chain")).not.toBeInTheDocument();
	});
});
