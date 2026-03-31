import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PContact } from "../pages/static";

describe("Contact page", () => {
	it("renders the contact gallery with all team portraits", () => {
		render(
			<MemoryRouter initialEntries={["/contact"]}>
				<PContact />
			</MemoryRouter>,
		);

		expect(screen.getByText("CONTACT")).toBeInTheDocument();
		expect(screen.getByAltText("fmixtur portrait")).toHaveAttribute("src", "/imgs/pp/fmixtur.jpg");
		expect(screen.getByAltText("hcavet portrait")).toHaveAttribute("src", "/imgs/pp/hcavet.jpg");
		expect(screen.getByAltText("kgauthie portrait")).toHaveAttribute(
			"src",
			"/imgs/pp/kgauthie.jpg",
		);
		expect(screen.getByAltText("vviterbo portrait")).toHaveAttribute(
			"src",
			"/imgs/pp/vviterbo.jpg",
		);
		expect(screen.getByAltText("yisho portrait")).toHaveAttribute("src", "/imgs/pp/yisho.jpg");
		expect(screen.getByRole("link", { name: /fmixtur/i })).toHaveAttribute(
			"href",
			"mailto:fmixtur@student.42lausanne.ch",
		);
		expect(screen.getByRole("link", { name: /hcavet/i })).toHaveAttribute(
			"href",
			"mailto:hcavet@student.42lausanne.ch",
		);
		expect(screen.getByRole("link", { name: /kgauthie/i })).toHaveAttribute(
			"href",
			"mailto:kgauthie@student.42lausanne.ch",
		);
		expect(screen.getByRole("link", { name: /vviterbo/i })).toHaveAttribute(
			"href",
			"mailto:vviterbo@student.42lausanne.ch",
		);
		expect(screen.getByRole("link", { name: /yisho/i })).toHaveAttribute(
			"href",
			"mailto:yisho@student.42lausanne.ch",
		);
		expect(screen.getByText("PROJECT_MANAGER")).toBeInTheDocument();
		expect(screen.getByText("PRODUCT_OWNER")).toBeInTheDocument();
		expect(screen.getByText("TECH_LEAD")).toBeInTheDocument();
		expect(screen.getAllByText("DEVELOPER").length).toBeGreaterThan(0);
	});
});
