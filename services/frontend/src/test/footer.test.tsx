import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PHomePage from "../pages/PHomePage";

describe("Footer", () => {
	it("renders centered footer links while keeping a single language button on the page", () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<PHomePage />
			</MemoryRouter>,
		);

		expect(screen.getAllByRole("button", { name: /language selection/i })).toHaveLength(1);
		expect(screen.getByRole("link", { name: "CONTACT" })).toHaveAttribute("href", "/contact");
		expect(screen.getByRole("link", { name: "Q_AND_A" })).toHaveAttribute("href", "/qa");
		expect(screen.getByRole("link", { name: "TERMS_OF_SERVICE" })).toHaveAttribute(
			"href",
			"/terms-of-service",
		);
		expect(screen.getByRole("link", { name: "PRIVACY_POLICY" })).toHaveAttribute(
			"href",
			"/privacy-policy",
		);
	});
});
