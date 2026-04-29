import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
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

function LocationProbe() {
	const location = useLocation();
	return <span data-testid="location">{location.pathname}</span>;
}

const renderRow = (entry: ILeaderboardEntry) => {
	return render(
		<MemoryRouter initialEntries={["/leaderboard"]}>
			<PLeaderboardRow entry={entry} />
			<LocationProbe />
		</MemoryRouter>,
	);
};

describe("PLeaderboardRow", () => {
	beforeEach(() => {
		resolveProfileImageMock.mockReset();
		resolveProfileImageMock.mockReturnValue(undefined);
	});

	it("renders the leaderboard entry details and localized points label", () => {
		renderRow(createEntry());

		expect(screen.getByText("7")).toBeInTheDocument();
		expect(screen.getByText("mika")).toBeInTheDocument();
		expect(screen.getByText("Steady Lynx")).toBeInTheDocument();
		expect(screen.getByText("Points")).toBeInTheDocument();
		expect(screen.getByText("630")).toBeInTheDocument();
		expect(resolveProfileImageMock).toHaveBeenCalledWith("/DB/media/default_pp.jpg");
	});

	it("falls back to the username initial when no resolved profile image is available", () => {
		renderRow(createEntry({ username: "zoe" }));

		expect(screen.getByText("Z")).toBeInTheDocument();
	});

	it("renders multi-digit rankings and current-user entries as regular rows", () => {
		renderRow(
			createEntry({
				username: "john",
				xp: 120,
				badges: "Dazed Jellyfish",
				ranking: 14,
				isCurrentUser: true,
			}),
		);

		expect(screen.getByText("14")).toBeInTheDocument();
		expect(screen.getByText("john")).toBeInTheDocument();
		expect(screen.getByText("120")).toBeInTheDocument();
		expect(screen.queryByText("You")).not.toBeInTheDocument();
	});

	it("navigates to the user profile when avatar or username is clicked", async () => {
		const user = userEvent.setup();
		renderRow(createEntry({ username: "mika" }));

		await user.click(screen.getByRole("button", { name: "mika" }));
		expect(screen.getByTestId("location")).toHaveTextContent("/users/mika");
	});
});
