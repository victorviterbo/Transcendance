import { afterEach, beforeEach, describe, beforeAll, afterAll, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { setAccessToken } from "../../api";
import { server } from "../../mock/server";
import { mockSocialResetDB } from "../../mock/handlers/social/social_dbs";
import { mockSetGameError } from "../../mock/handlers/game/game";
import { CAuthProvider } from "../../components/auth/CAuthProvider";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PGameBase from "../../pages/PGame/PGameBase";
import { MOCK_HOST_ROOM, MOCK_JOIN_ROOM, mockGetGameData } from "../../mock/handlers/game/game_db";
import type { IGameData, IGamePlayer } from "../../types/game";

const textClean = (Input: string) => {
	Input = Input.replaceAll(/<.+?>/gi, "");
	return Input;
};

describe("Tests for lobby view", () => {
	beforeAll(() => {
		setAccessToken("authed");
		server.listen();
		mockSocialResetDB();
	});
	beforeEach(() => {
		mockSetGameError(false);
		mockSocialResetDB();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => server.close());

	it("Checking all information in lobby view", { timeout: 20000 }, async () => {
		window.history.pushState({}, "", "/game/" + MOCK_JOIN_ROOM);

		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/game/" + MOCK_JOIN_ROOM]}>
					<Routes>
						<Route path="/game/*" element={<PGameBase />} />
					</Routes>
				</MemoryRouter>
			</CAuthProvider>,
		);

		let data: IGameData | undefined;
		let lobbyView: HTMLElement | undefined;
		let host: IGamePlayer | undefined;
		await waitFor(() => {
			data = mockGetGameData(MOCK_JOIN_ROOM);
			lobbyView = screen.getByTestId("PGameLobby");
			expect(lobbyView).toBeInTheDocument();
			expect(within(lobbyView).getByText(data.name));

			//Checking wating
			host = data.players.find((player) => player.host);
			if (host)
				expect(
					textClean(within(lobbyView).getByTestId("PGameLobby-Waiting").innerHTML),
				).toEqual("Waiting " + host.user.username + " to start the game");
			else
				expect(
					textClean(within(lobbyView).getByTestId("PGameLobby-Waiting").innerHTML),
				).toEqual("Waiting to start the game");

			expect(within(lobbyView).getByText("Players: 5 / 100")).toBeInTheDocument();
		});

		await waitFor(
			() => {
				if (!lobbyView) return;

				expect(within(lobbyView).getByText("Players: 20 / 100")).toBeInTheDocument();
			},
			{ timeout: 8000 },
		);

		await waitFor(
			() => {
				if (!lobbyView) return;

				expect(within(lobbyView).getByText("Players: 17 / 100")).toBeInTheDocument();
			},
			{ timeout: 8000 },
		);
	});

	it("Checking all information in lobby view (As host)", { timeout: 10000 }, async () => {
		window.history.pushState({}, "", "/game/" + MOCK_HOST_ROOM);

		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/game/" + MOCK_HOST_ROOM]}>
					<Routes>
						<Route path="/game/*" element={<PGameBase />} />
					</Routes>
				</MemoryRouter>
			</CAuthProvider>,
		);

		let data: IGameData | undefined;
		let lobbyView: HTMLElement | undefined;
		await waitFor(() => {
			data = mockGetGameData(MOCK_HOST_ROOM);
			lobbyView = screen.getByTestId("PGameLobby");
			expect(lobbyView).toBeInTheDocument();
			expect(within(lobbyView).getByText(data.name));

			//Checking wating
			expect(within(lobbyView).queryByTestId("PGameLobby-Waiting")).not.toBeInTheDocument();
			expect(within(lobbyView).getByText("Players: 1 / 100")).toBeInTheDocument();

			//Checking buttons
			const buttons = within(lobbyView).getAllByRole("button");
			expect(buttons.length).toEqual(2);
			expect(
				buttons.find((el) => {
					return el.innerHTML.includes("GAME_START");
				}),
			).toBeInTheDocument();
			expect(
				buttons.find((el) => {
					return el.innerHTML.includes("GAME_EDIT");
				}),
			).toBeInTheDocument();
		});

		await waitFor(
			() => {
				if (!lobbyView) return;

				expect(within(lobbyView).getByText("Players: 14 / 100")).toBeInTheDocument();
			},
			{ timeout: 8000 },
		);
	});
});
