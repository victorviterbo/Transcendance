import { afterEach, beforeEach, describe, beforeAll, afterAll, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { setAccessToken } from "../../api";
import { server } from "../../mock/server";
import { mockSocialDB, mockSocialResetDB } from "../../mock/handlers/social/social_dbs";
import { mockSetGameError } from "../../mock/handlers/game/game";
import type { IGameChatMsg, IGamePlayer } from "../../types/game";
import PGameChatNode from "../../pages/PGame/PGameChatNode";
import { colorFromID, colorHexToColor } from "../../utils/styles";
import { CAuthProvider } from "../../components/auth/CAuthProvider";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PGameBase from "../../pages/PGame/PGameBase";
import userEvent from "@testing-library/user-event";
import { mockDefaultUsername } from "../../mock/db";

const textClean = (Input: string) => {
	Input = Input.replaceAll(/<.+?>/gi, "");
	return Input;
};

describe("Tests for chat view", () => {
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

	it("NODE: Checking  base info (Message)", async () => {
		const currentUser: IGamePlayer = {
			points: 150,
			user: {
				...mockSocialDB.users[0],
				image: "/DB/media/default_pp.jpg",
			},
			host: false,
			colorid: 5,
		};
		const currentChat: IGameChatMsg = {
			useruid: currentUser.user.uid,
			username: currentUser.user.username,
			messageuid: crypto.randomUUID(),

			type: "message",
			message: "hello hello !!!",
		};

		render(<PGameChatNode message={currentChat} user={currentUser}></PGameChatNode>);

		await waitFor(() => {
			const textComp: HTMLElement = screen.getByTestId("PGameChatNode-" + currentChat.type);
			expect(textComp).toBeInTheDocument();
			expect(textClean(textComp.innerHTML)).toEqual(
				currentChat.username + ": " + currentChat.message,
			);
			const currentColor = colorHexToColor(colorFromID(currentUser.colorid));
			expect(
				textComp.innerHTML.includes(
					"rgb(" + currentColor.r + ", " + currentColor.g + ", " + currentColor.b + ")",
				),
			).toBeTruthy();
		});
	});

	it("NODE: Checking  base info (Joined)", async () => {
		const currentUser: IGamePlayer = {
			points: 150,
			user: {
				...mockSocialDB.users[0],
				image: "/DB/media/default_pp.jpg",
			},
			host: false,
			colorid: 5,
		};
		const currentChat: IGameChatMsg = {
			useruid: currentUser.user.uid,
			username: currentUser.user.username,
			messageuid: crypto.randomUUID(),

			type: "joined",
		};

		render(<PGameChatNode message={currentChat} user={currentUser}></PGameChatNode>);

		await waitFor(() => {
			const textComp: HTMLElement = screen.getByTestId("PGameChatNode-" + currentChat.type);
			expect(textComp).toBeInTheDocument();
			expect(textClean(textComp.innerHTML)).toEqual(
				currentChat.username + " has joined the game.",
			);
			const currentColor = colorHexToColor(colorFromID(currentUser.colorid));
			expect(
				textComp.innerHTML.includes(
					"rgb(" + currentColor.r + ", " + currentColor.g + ", " + currentColor.b + ")",
				),
			).toBeTruthy();
		});
	});

	it("NODE: Checking  base info (Leaved)", async () => {
		const currentUser: IGamePlayer = {
			points: 150,
			user: {
				...mockSocialDB.users[0],
				image: "/DB/media/default_pp.jpg",
			},
			host: false,
			colorid: 5,
		};
		const currentChat: IGameChatMsg = {
			useruid: currentUser.user.uid,
			username: currentUser.user.username,
			messageuid: crypto.randomUUID(),

			type: "leaved",
		};

		render(<PGameChatNode message={currentChat} user={currentUser}></PGameChatNode>);

		await waitFor(() => {
			const textComp: HTMLElement = screen.getByTestId("PGameChatNode-" + currentChat.type);
			expect(textComp).toBeInTheDocument();
			expect(textClean(textComp.innerHTML)).toEqual(
				currentChat.username + " has left the game.",
			);
			const currentColor = colorHexToColor(colorFromID(currentUser.colorid));
			expect(
				textComp.innerHTML.includes(
					"rgb(" + currentColor.r + ", " + currentColor.g + ", " + currentColor.b + ")",
				),
			).toBeTruthy();
		});
	});

	it("NODE: Checking  base info (Guessed)", async () => {
		const currentUser: IGamePlayer = {
			points: 150,
			user: {
				...mockSocialDB.users[0],
				image: "/DB/media/default_pp.jpg",
			},
			host: false,
			colorid: 5,
		};
		const currentChat: IGameChatMsg = {
			useruid: currentUser.user.uid,
			username: currentUser.user.username,
			messageuid: crypto.randomUUID(),

			type: "guessed",
			message: "Sea city girl",
		};

		render(<PGameChatNode message={currentChat} user={currentUser}></PGameChatNode>);

		await waitFor(() => {
			const textComp: HTMLElement = screen.getByTestId("PGameChatNode-" + currentChat.type);
			expect(textComp).toBeInTheDocument();
			expect(textClean(textComp.innerHTML)).toEqual(
				currentChat.username + " tried: " + currentChat.message,
			);
			const currentColor = colorHexToColor(colorFromID(currentUser.colorid));
			expect(
				textComp.innerHTML.includes(
					"rgb(" + currentColor.r + ", " + currentColor.g + ", " + currentColor.b + ")",
				),
			).toBeTruthy();
		});
	});

	it("NODE: Checking  base info (Found)", async () => {
		const currentUser: IGamePlayer = {
			points: 150,
			user: {
				...mockSocialDB.users[0],
				image: "/DB/media/default_pp.jpg",
			},
			host: false,
			colorid: 5,
		};
		const currentChat: IGameChatMsg = {
			useruid: currentUser.user.uid,
			username: currentUser.user.username,
			messageuid: crypto.randomUUID(),

			type: "found",
		};

		render(<PGameChatNode message={currentChat} user={currentUser}></PGameChatNode>);

		await waitFor(() => {
			const textComp: HTMLElement = screen.getByTestId("PGameChatNode-" + currentChat.type);
			expect(textComp).toBeInTheDocument();
			expect(textClean(textComp.innerHTML)).toEqual(
				currentChat.username + " made a correct guess",
			);
			const currentColor = colorHexToColor(colorFromID(currentUser.colorid));
			expect(
				textComp.innerHTML.includes(
					"rgb(" + currentColor.r + ", " + currentColor.g + ", " + currentColor.b + ")",
				),
			).toBeTruthy();
		});
	});

	it("Checking all kind of messages event", { timeout: 30000 }, async () => {
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
			nodeList = screen.getAllByTestId("PGameChatNode");
			expect(nodeList.length).toEqual(12);
		});

		if (nodeList.length != 12) return;
		await waitFor(
			() => {
				expect(screen.getAllByTestId("PGameChatNode").length).toEqual(33);
				expect(screen.getAllByTestId("PGameChatNode-message").length).toEqual(8);
				expect(screen.getAllByTestId("PGameChatNode-joined").length).toEqual(20);
				expect(screen.getAllByTestId("PGameChatNode-leaved").length).toEqual(3);
				expect(screen.getAllByTestId("PGameChatNode-guessed").length).toEqual(1);
				expect(screen.getAllByTestId("PGameChatNode-found").length).toEqual(1);
			},
			{ timeout: 15000 },
		);

		//TYPING MESSAGE
		const inputs = ["Hello", "How are you mate !!!", "Let's go..."];
		const textField = screen.getByTestId("PGameChat-TextField");
		expect(textField).toBeInTheDocument();
		const input = within(textField).getByRole("textbox");
		const sendButton = screen.getByTestId("PGameChat-SendButton");
		expect(sendButton).toBeInTheDocument();

		for (let i = 0; i < inputs.length; i++) {
			await userEvent.type(input, inputs[i]);
			await userEvent.click(sendButton);

			await waitFor(
				() => {
					expect(screen.getAllByTestId("PGameChatNode").length).toEqual(33 + i * 2 + 2);
					const messages = screen.getAllByTestId("PGameChatNode-message");
					expect(messages.length).toEqual(8 + i * 2 + 2);
					expect(
						messages.find((el: HTMLElement) => {
							return (
								textClean(el.innerHTML) == mockDefaultUsername + ": " + inputs[i]
							);
						}),
					).toBeDefined();
					expect(screen.getAllByTestId("PGameChatNode-joined").length).toEqual(20);
					expect(screen.getAllByTestId("PGameChatNode-leaved").length).toEqual(3);
					expect(screen.getAllByTestId("PGameChatNode-guessed").length).toEqual(1);
					expect(screen.getAllByTestId("PGameChatNode-found").length).toEqual(1);
				},
				{ timeout: 3000 },
			);
		}
	});
});
