import { afterEach, beforeEach, describe, beforeAll, afterAll, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import PGameBase from "../../pages/PGame/PGameBase";
import { CAuthProvider } from "../../components/auth/CAuthProvider";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setAccessToken } from "../../api";
import { server } from "../../mock/server";
import { mockSocialDB, mockSocialResetDB } from "../../mock/handlers/social/social_dbs";
import { mockSetGameError } from "../../mock/handlers/game/game";
import PGameLBoardNode from "../../pages/PGame/PGameLBoardNode";
import type { IGamePlayer } from "../../types/game";
import { mockDefaultUsername } from "../../mock/db";

describe("Tests for leaderboard view", () => {
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

	it("NODE: Checking  base info", async () => {
		const currentUser: IGamePlayer = {
			points: 150,
			user: {
				...mockSocialDB.users[0],
				image: "/DB/media/default_pp.jpg",
			},
			host: false,
			colorid: 0,
		};

		render(<PGameLBoardNode position={3} user={currentUser}></PGameLBoardNode>);

		await waitFor(() => {
			expect(screen.getByText("150")).toBeInTheDocument();
			expect(screen.getByText("4.")).toBeInTheDocument();
			expect(screen.getByText(currentUser.user.username)).toBeInTheDocument();
			const imageNode = screen.getByRole("img");
			expect(imageNode).toBeInTheDocument();
			expect(imageNode.getAttribute("src") == currentUser.user.image).toBeTruthy();
		});
	});

	it("NODE: Checking  colors info", async () => {
		const currentUsers: IGamePlayer[] = [];
		for (let i = 0; i < 5; i++) {
			currentUsers.push({
				points: 150,
				user: {
					...mockSocialDB.users[i],
					image: "/DB/media/default_pp.jpg",
					relation: i == 3 ? "self" : "not-friends",
				},
				host: i == 0,
				colorid: 0,
			});
		}

		render(
			<>
				{currentUsers.map((player: IGamePlayer, index: number) => {
					return (
						<PGameLBoardNode
							position={index}
							user={player}
							key={index}
						></PGameLBoardNode>
					);
				})}
			</>,
		);

		let list: HTMLElement[] = [];
		await waitFor(() => {
			list = screen.getAllByTestId("PGameLBoardNode");
			expect(list.length).toEqual(5);
		});

		if (list.length != 5) return;

		list.forEach((el: HTMLElement, index: number) => {
			if (index >= 4) return;

			list.forEach((subEl: HTMLElement, subIndex: number) => {
				if (index == subIndex) return;
				if (index == 3 && subIndex == 4) {
					expect(window.getComputedStyle(el).background).toEqual(
						window.getComputedStyle(subEl).background,
					);
					return;
				}
				expect(window.getComputedStyle(el).background).not.toEqual(
					window.getComputedStyle(subEl).background,
				);
			});
		});

		expect(window.getComputedStyle(list[0]).border).not.toEqual("");
		expect(window.getComputedStyle(list[3]).border).not.toEqual("");
		expect(window.getComputedStyle(list[4]).border).toEqual("");
	});

	it("Checking leader player join and leave events", { timeout: 25000 }, async () => {
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/game/123456"]}>
					<Routes>
						<Route path="/game/*" element={<PGameBase />} />
					</Routes>
				</MemoryRouter>
			</CAuthProvider>,
		);

		let nodeList: HTMLElement[] = [];
		await waitFor(() => {
			nodeList = screen.getAllByTestId("PGameLBoardNode");
			expect(nodeList.length).toEqual(5);
		});

		if (nodeList.length != 5) return;

		//FINDING SELF
		expect(
			nodeList.find((el: HTMLElement) => {
				return (
					window.getComputedStyle(el).border != "" &&
					within(el).queryByText(mockDefaultUsername)
				);
			}),
		).toBeInTheDocument();

		//All connect
		await waitFor(
			() => {
				nodeList = screen.getAllByTestId("PGameLBoardNode");
				expect(nodeList.length).toEqual(20);
			},
			{ timeout: 8000 },
		);

		// 3 Players should leave
		await waitFor(
			() => {
				nodeList = screen.getAllByTestId("PGameLBoardNode");
				expect(nodeList.length).toEqual(17);
			},
			{ timeout: 15000 },
		);

		///CHECK THAT ALL 3 MISSING ARE NOT IN THE LIST
		[6, 9, 11].forEach((value: number) => {
			expect(
				nodeList.find((el: HTMLElement) => {
					return !!within(el).queryByText(mockSocialDB.users[value].username);
				}),
			).toBeUndefined();
		});
	});
});
