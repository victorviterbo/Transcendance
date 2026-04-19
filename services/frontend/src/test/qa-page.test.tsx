import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PQA } from "../pages/static";

describe("Q&A page", () => {
	it("renders faq accordions instead of the old placeholder", async () => {
		render(
			<MemoryRouter initialEntries={["/q-and-a"]}>
				<PQA />
			</MemoryRouter>,
		);

		waitFor(() => {
			expect(screen.getByRole("heading", { name: "Q_AND_A" })).toBeInTheDocument();
			expect(screen.getByText("QA_INTRO")).toBeInTheDocument();
			expect(screen.getByText("QA_PROFILE_PICTURE_QUESTION")).toBeInTheDocument();
			expect(screen.getByText("QA_ACCOUNT_INFO_QUESTION")).toBeInTheDocument();
			expect(screen.getByText("QA_MATCH_RULES_QUESTION")).toBeInTheDocument();
			expect(screen.getByText("QA_GAME_CONFIGURATION_QUESTION")).toBeInTheDocument();
			expect(screen.getByText("QA_GAME_ACCESSIBILITY_QUESTION")).toBeInTheDocument();
			expect(screen.getByText("QA_PROFILE_PICTURE_ANSWER")).toBeInTheDocument();
			expect(screen.queryByText("Q&A page")).not.toBeInTheDocument();
		});
	});
});
