import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PLeaderboardRow from "../pages/PLeaderboardPage/PLeaderboardRow";
import type { ILeaderboardEntry } from "../types/stats";

const resolveProfileImageMock = vi.fn();

vi.mock("../api/profile", () => ({
	resolveProfileImage: (...args: unknown[]) => resolveProfileImageMock(...args),
}));

const createEntry = (overrides: Partial<ILeaderboardEntry> = {}): ILeaderboardEntry => ({
	username: "mika",
	avatar: "/DB/media/default_pp.jpg",
	xp: 630,
	badges: "Steady Lynx",
	ranking: 7,
	isCurrentUser: false,
	...overrides,
});

describe("PLeaderboardRow", () => {
	beforeEach(() => {
		resolveProfileImageMock.mockReset();
		resolveProfileImageMock.mockReturnValue(undefined);
	});

	it("renders the leaderboard entry details and localized points label", () => {
		render(<PLeaderboardRow entry={createEntry()} />);

		expect(screen.getByText("7")).toBeInTheDocument();
		expect(screen.getByText("mika")).toBeInTheDocument();
		expect(screen.getByText("Steady Lynx")).toBeInTheDocument();
		expect(screen.getByText("Points")).toBeInTheDocument();
		expect(screen.getByText("630")).toBeInTheDocument();
		expect(resolveProfileImageMock).toHaveBeenCalledWith("/DB/media/default_pp.jpg");
	});

	it("falls back to the username initial when no resolved profile image is available", () => {
		render(<PLeaderboardRow entry={createEntry({ username: "zoe" })} />);

		expect(screen.getByText("Z")).toBeInTheDocument();
	});

	it("renders multi-digit rankings and current-user entries as regular rows", () => {
		render(
			<PLeaderboardRow
				entry={createEntry({
					username: "john",
					xp: 120,
					badges: "Dazed Jellyfish",
					ranking: 14,
					isCurrentUser: true,
				})}
			/>,
		);

		expect(screen.getByText("14")).toBeInTheDocument();
		expect(screen.getByText("john")).toBeInTheDocument();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.queryByText("You")).not.toBeInTheDocument();
	});
});
