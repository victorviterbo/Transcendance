import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CFooter from "../components/navigation/CFooter";

describe("Footer", () => {
	it("renders centered footer links while keeping a single language button on the page", async () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<CFooter />
			</MemoryRouter>,
		);

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
