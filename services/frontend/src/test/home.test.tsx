import { afterEach, describe, beforeAll, afterAll, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import PHomePage from "../pages/PHomePage";
import { MemoryRouter } from "react-router-dom";
import { CAuthProvider } from "../components/auth/CAuthProvider";
import { setAccessToken } from "../api";
import { server } from "../mock/server";
import { http, HttpResponse } from "msw";
import { API_AUTH_REFRESH } from "../constants";
import { makeAccessToken } from "../mock/handlers/auth";

describe("Home rendering tests", () => {
	beforeAll(() => {
		setAccessToken("authed");
		server.listen();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => server.close());

	it("Check for public rooms list", async () => {
		server.use(
			http.post(API_AUTH_REFRESH, () => {
				return HttpResponse.json(
					{ access: makeAccessToken(), username: "john" },
					{ status: 200 },
				);
			}),
		);

		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<PHomePage />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("PUBLIC_ROOM")).toBeInTheDocument();
			expect(screen.getByTestId("public_room_testid")).toBeInTheDocument();
		});
	});

	it("Check fr private rooms list", async () => {
		server.use(
			http.post(API_AUTH_REFRESH, () => {
				return HttpResponse.json(
					{ access: makeAccessToken(), username: "john" },
					{ status: 200 },
				);
			}),
		);

		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<PHomePage />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("FRIEND_ROOM")).toBeInTheDocument();
			expect(screen.getByTestId("private_room_testid")).toBeInTheDocument();
		});
	});

	it("Check for room buttons", async () => {
		server.use(
			http.post(API_AUTH_REFRESH, () => {
				return HttpResponse.json(
					{ access: makeAccessToken(), username: "john" },
					{ status: 200 },
				);
			}),
		);

		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<PHomePage />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(
			() => {
				const rooms = screen.getAllByTestId("PRoomCard");
				expect(rooms.length).toBeGreaterThan(0);

				const allTexts = within(rooms[0]).getAllByTestId("CTextBase");
				expect(allTexts).toHaveLength(3);

				const foundtext = within(rooms[0]).getByText(/\d+ \/ \d+/);
				expect(foundtext).toBeInTheDocument();
			},
			{ timeout: 4000 },
		);
	});
});
