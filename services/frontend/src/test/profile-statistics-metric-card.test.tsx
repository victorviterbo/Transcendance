import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PProfileStatisticsMetricCard from "../pages/PProfilePage/PProfileStatisticsMetricCard";

describe("PProfileStatisticsMetricCard", () => {
	it("renders the stacked metric layout", () => {
		render(
			<PProfileStatisticsMetricCard
				icon={<div>ICON_GAMES</div>}
				label="STATS_GAMES_PLAYED"
				value="35"
			/>,
		);

		expect(screen.getByText("ICON_GAMES")).toBeInTheDocument();
		expect(screen.getByText("Games played")).toBeInTheDocument();
		expect(screen.getByText("35")).toBeInTheDocument();
	});

	it("renders the inline metric layout without requiring an icon", () => {
		render(
			<PProfileStatisticsMetricCard
				label="TAG_POP"
				value="12.5%"
				variant="inline"
				tone="secondary"
			/>,
		);

		expect(screen.getByText("Pop")).toBeInTheDocument();
		expect(screen.getByText("12.5%")).toBeInTheDocument();
	});
});
