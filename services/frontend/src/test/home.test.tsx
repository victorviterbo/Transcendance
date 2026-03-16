import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PHomePage from "../pages/PHomePage";
import { MemoryRouter } from "react-router-dom";

describe("Home rendering tests", () => {
	it("Check for public rooms list", async () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<PHomePage></PHomePage>
			</MemoryRouter>,
		);

		expect(screen.getByText("PUBLIC_ROOM")).toBeInTheDocument();
		expect(screen.getByTestId("public_room_testid")).toBeInTheDocument();
	});

	it("Check for private rooms list", async () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<PHomePage></PHomePage>
			</MemoryRouter>,
		);

		expect(screen.getByText("FRIEND_ROOM")).toBeInTheDocument();
		expect(screen.getByTestId("private_room_testid")).toBeInTheDocument();
	});

	it("Check for room buttons", async () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<PHomePage></PHomePage>
			</MemoryRouter>,
		);

		const rooms = await screen.findAllByTestId("CButtonRoom");
		expect(rooms.length).toBeGreaterThan(0);

		const allTexts = await within(rooms[0]).findAllByTestId("CTextBase");
		expect(allTexts).toHaveLength(3);

		const foundtext = within(rooms[0]).getByText(/\d+ \/ \d+/gm);
		expect(foundtext).toBeInTheDocument();
	});
});
