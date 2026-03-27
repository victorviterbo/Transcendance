import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getProfileLevelProgress } from "../api/profile";
import CLevelProgress from "../components/feedback/CLevelProgress";

describe("CLevelProgress", () => {
	it("derives level progress from total XP", () => {
		expect(getProfileLevelProgress(275)).toMatchObject({
			level: 2,
			progressPercent: 75,
		});
	});

	it("renders the title, level, and percentage bar", () => {
		render(<CLevelProgress level={2} progressPercent={75} title="Arcade Hero" />);

		expect(screen.getByText("Arcade Hero")).toBeInTheDocument();
		expect(screen.getByText("75%")).toBeInTheDocument();
		expect(screen.queryByText("275 XP total")).not.toBeInTheDocument();
		expect(screen.queryByText("75 / 100 XP this level")).not.toBeInTheDocument();
		expect(
			screen.getByRole("progressbar", { name: "Arcade Hero level progress" }),
		).toHaveAttribute("aria-valuenow", "75");
	});
});
