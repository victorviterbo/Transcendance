import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PProfileMatchHistoryPanel from "../pages/PProfilePage/PProfileMatchHistoryPanel";

describe("PProfileMatchHistoryPanel", () => {
	it("renders the default personal match history when no history is provided", () => {
		render(<PProfileMatchHistoryPanel />);

		expect(screen.getByText("2026-02-20 — AcePilot")).toBeInTheDocument();
		expect(screen.getByText("Score: 10 - 7 • WIN")).toBeInTheDocument();
		expect(screen.getByText("2026-02-16 — NovaKing")).toBeInTheDocument();
	});

	it("renders a custom empty message when the history is empty", () => {
		render(
			<PProfileMatchHistoryPanel history={[]} emptyMessage="PROFILE_MATCH_HISTORY_EMPTY" />,
		);

		expect(screen.getByText("PROFILE_MATCH_HISTORY_EMPTY")).toBeInTheDocument();
	});

	it("renders a provided history instead of the default one", () => {
		render(
			<PProfileMatchHistoryPanel
				history={[
					{
						date: "2026-04-19",
						opponent: "Luna",
						score: "11 - 9",
						result: "WIN",
					},
				]}
			/>,
		);

		expect(screen.getByText("2026-04-19 — Luna")).toBeInTheDocument();
		expect(screen.getByText("Score: 11 - 9 • WIN")).toBeInTheDocument();
		expect(screen.queryByText("2026-02-20 — AcePilot")).not.toBeInTheDocument();
	});
});
