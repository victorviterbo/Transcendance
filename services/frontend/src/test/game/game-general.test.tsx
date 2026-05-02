import { afterEach, beforeEach, describe, beforeAll, afterAll, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PGameBase from "../../pages/PGame/PGameBase";
import { CAuthProvider } from "../../components/auth/CAuthProvider";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setAccessToken } from "../../api";
import { server } from "../../mock/server";
import { mockSocialResetDB } from "../../mock/handlers/social/social_dbs";
import { mockSetGameError } from "../../mock/handlers/game/game";

describe("Common game page tests", () => {
	beforeAll(() => {
		setAccessToken("authed");
		server.listen();
		mockSocialResetDB();
	});
	beforeEach(() => {
		window.history.pushState({}, "", "/game/123456");
		mockSetGameError(false);
		mockSocialResetDB();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => server.close());

	//ERRORS
	it("No game id given", async () => {
		window.history.pushState({}, "", "/game/");
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/game/123456"]}>
					<Routes>
						<Route path="/game/*" element={<PGameBase />} />
					</Routes>
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("GAME_ERROR_TITLE")).toBeInTheDocument();
			expect(screen.getByText("GAME_ERROR_INVALID_ROOM")).toBeInTheDocument();
		});
	});
	it("Room not existing", async () => {
		window.history.pushState({}, "", "/game/456");
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/game/456"]}>
					<Routes>
						<Route path="/game/*" element={<PGameBase />} />
					</Routes>
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("GAME_ERROR_TITLE")).toBeInTheDocument();
			expect(screen.getByText("GAME_ERROR_GLOBAL")).toBeInTheDocument();
		});
	});
	it("Fecth error", async () => {
		mockSetGameError(true);
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/game/123456"]}>
					<Routes>
						<Route path="/game/*" element={<PGameBase />} />
					</Routes>
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("GAME_ERROR_TITLE")).toBeInTheDocument();
			expect(screen.getByText("GAME_ERROR_GLOBAL")).toBeInTheDocument();
		});
	});

	it("Checking all base views", async () => {
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/game/123456"]}>
					<Routes>
						<Route path="/game/*" element={<PGameBase />} />
					</Routes>
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByText("GAME_ERROR_TITLE")).not.toBeInTheDocument();
			expect(screen.queryByText("GAME_ERROR_GLOBAL")).not.toBeInTheDocument();
			expect(screen.queryByText("GAME_ERROR_INVALID_ROOM")).not.toBeInTheDocument();
			expect(screen.getByText("GAME_LEADER_BOARD")).toBeInTheDocument();
			expect(screen.getByText("GAME_LOBBY_TITLE")).toBeInTheDocument();
			expect(screen.getByText("GAME_CHAT_TITLE")).toBeInTheDocument();
		});
	});
});
