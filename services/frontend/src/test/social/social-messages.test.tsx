import CWebsocket from "../../components/websocket/CWebsocket";
import { afterAll, afterEach, beforeAll, describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { server } from "../../mock/server";
import PFriendChat from "../../pages/PSocial/PFriendChat";
import PFriendChatNode from "../../pages/PSocial/PFriendChatNode";
import {
	mockGetMessageDB,
	mockResetMessageDB,
	type IMockMessageDBUser,
} from "../../mock/handlers/social/socialChat_dbs";
import { mockSocialDB, mockSocialResetDB } from "../../mock/handlers/social/social_dbs";
import type { IFriendInfo, IFriendMessage, TMessageStatus } from "../../types/friends";
import userEvent from "@testing-library/user-event";

describe("Websocket - data recieve", () => {
	beforeAll(() => {
		server.listen();
		mockSocialResetDB();
		mockResetMessageDB();
	});
	beforeEach(() => {
		mockSocialResetDB();
		mockResetMessageDB();
	});
	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	//ADD FRIENDS
	it("Node: check node base data (Incoming)", async () => {
		const messageDB = mockGetMessageDB();
		const targetFriend = messageDB.data[1].friend;
		const message = messageDB.data[1].messages.feed[0];

		function getDate(): string {
			let currentDate: Date | string = message.date;
			if (typeof currentDate == "string") currentDate = new Date(message.date.toString());
			return currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString();
		}

		render(<PFriendChatNode targetFriend={targetFriend} message={message}></PFriendChatNode>);

		expect(screen.getByText(message.message));
		expect(screen.getByText(getDate()));

		const target = screen.getByTestId("PFriendChatNode");
		expect(target).toBeInTheDocument();
		expect(
			window
				.getComputedStyle(target)
				.background.includes("linear-gradient(160deg, #E2BF1F 0%, #e25d1f 100%)"),
		).toBeTruthy();
		expect(window.getComputedStyle(target).marginRight == "auto").toBeTruthy();
		expect(
			screen.queryByTestId(/AccessTimeIcon|CheckIcon|DoneAllIcon/),
		).not.toBeInTheDocument();
	});

	it("Node: check node base data (Outgoing)", async () => {
		const messageDB = mockGetMessageDB();
		const targetFriend = messageDB.data[1].friend;
		const message = messageDB.data[1].messages.feed[1];

		function getDate(): string {
			let currentDate: Date | string = message.date;
			if (typeof currentDate == "string") currentDate = new Date(message.date.toString());
			return currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString();
		}

		render(<PFriendChatNode targetFriend={targetFriend} message={message}></PFriendChatNode>);

		expect(screen.getByText(message.message));
		expect(screen.getByText(getDate()));

		const target = screen.getByTestId("PFriendChatNode");
		expect(target).toBeInTheDocument();
		expect(
			window
				.getComputedStyle(target)
				.background.includes("linear-gradient(160deg, #1FE2D8 0%, #239bff 100%)"),
		).toBeTruthy();
		expect(window.getComputedStyle(target).marginLeft == "auto").toBeTruthy();
		expect(screen.queryByTestId(/AccessTimeIcon|CheckIcon|DoneAllIcon/)).toBeInTheDocument();
	});

	it.each([
		["not-sent", "AccessTimeIcon", true],
		["sent", "CheckIcon", true],
		["recieved", "DoneAllIcon", true],
		["read", "DoneAllIcon", false],
	])("Node: check node checker icon: (Status: %s (%s))", async (Status, TestID, Black) => {
		const messageDB = mockGetMessageDB();
		const targetFriend = messageDB.data[1].friend;
		const message = messageDB.data[1].messages.feed[1];
		message.status = Status as TMessageStatus;

		render(<PFriendChatNode targetFriend={targetFriend} message={message}></PFriendChatNode>);

		const icon = screen.getByTestId(TestID);
		expect(icon).toBeInTheDocument();
		expect((window.getComputedStyle(icon).color == "rgb(0, 0, 0)") == Black).toBeTruthy();
	});

	it.each([["Hikari"]])("Chat: load past chat (Target: %s) -- Empty", async (Target) => {
		const messageDB = mockGetMessageDB();
		const targetFriend = messageDB.data.find((value: IMockMessageDBUser) => {
			return value.friend.username == Target;
		});
		expect(targetFriend).toBeDefined();
		if (!targetFriend) return;
		render(
			<CWebsocket>
				<PFriendChat targetFriend={targetFriend.friend}></PFriendChat>
			</CWebsocket>,
		);

		await waitFor(() => {
			expect(screen.getByText("SOCIAL_NO_MESSAGE")).toBeInTheDocument();
		});
	});

	it.each([["Akira"]])("Chat: load past chat (Target: %s) -- Error", async (Target) => {
		const friend = mockSocialDB.friends.find(
			(friend: IFriendInfo) => friend.username == Target,
		);
		expect(friend).toBeDefined();
		if (!friend) return;

		render(
			<CWebsocket>
				<PFriendChat targetFriend={friend}></PFriendChat>
			</CWebsocket>,
		);

		await waitFor(() => {
			expect(screen.getByText("SOCIAL_MESSAGE_ERROR")).toBeInTheDocument();
		});
	});

	it.each([["Ryu_88"], ["Kitsune"], ["NekoShadow"]])(
		"Chat: load past chat (Target: %s)",
		async (Target) => {
			const messageDB = mockGetMessageDB();
			const targetFriend = messageDB.data.find((value: IMockMessageDBUser) => {
				return value.friend.username == Target;
			});
			expect(targetFriend).toBeDefined();
			if (!targetFriend) return;
			render(
				<CWebsocket>
					<PFriendChat targetFriend={targetFriend.friend}></PFriendChat>
				</CWebsocket>,
			);

			const incoming: number = targetFriend.messages.feed.filter((value: IFriendMessage) => {
				return value.direction == "incoming";
			}).length;
			const outgoing: number = targetFriend.messages.feed.filter((value: IFriendMessage) => {
				return value.direction == "outgoing";
			}).length;
			const notsent: number = targetFriend.messages.feed.filter((value: IFriendMessage) => {
				return value.direction == "outgoing" && value.status == "not-sent";
			}).length;
			const sent: number = targetFriend.messages.feed.filter((value: IFriendMessage) => {
				return value.direction == "outgoing" && value.status == "sent";
			}).length;
			const recieved: number = targetFriend.messages.feed.filter((value: IFriendMessage) => {
				return value.direction == "outgoing" && value.status == "recieved";
			}).length;
			const read: number = targetFriend.messages.feed.filter((value: IFriendMessage) => {
				return value.direction == "outgoing" && value.status == "read";
			}).length;

			await waitFor(() => {
				const allChatNodes = screen.getAllByTestId("PFriendChatNode");
				expect(allChatNodes.length).toEqual(incoming + outgoing);

				const allIcoming = allChatNodes.filter((node: HTMLElement) => {
					return within(node).queryByTestId(/AccessTimeIcon|CheckIcon|DoneAllIcon/)
						? false
						: true;
				});
				expect(allIcoming.length).toEqual(incoming);

				const allOutgoing = screen.queryAllByTestId(/AccessTimeIcon|CheckIcon|DoneAllIcon/);
				expect(allOutgoing.length).toEqual(outgoing);

				const allNotSent = screen.queryAllByTestId("AccessTimeIcon");
				expect(allNotSent.length).toEqual(notsent);

				const allSent = screen.queryAllByTestId("CheckIcon");
				expect(allSent.length).toEqual(sent);

				const allRecieved = allChatNodes.filter((node: HTMLElement) => {
					const icon = within(node).queryByTestId("DoneAllIcon");
					if (!icon) return false;
					return window.getComputedStyle(icon).color == "rgb(0, 0, 0)";
				});
				expect(allRecieved.length).toEqual(recieved);

				const allRead = allChatNodes.filter((node: HTMLElement) => {
					const icon = within(node).queryByTestId("DoneAllIcon");
					if (!icon) return false;
					return window.getComputedStyle(icon).color != "rgb(0, 0, 0)";
				});
				expect(allRead.length).toEqual(read);
			});
		},
	);

	it("Chat: Trying to chat", { timeout: 30000 }, async () => {
		const messageDB = mockGetMessageDB();
		const targetFriend = messageDB.data.find((value: IMockMessageDBUser) => {
			return value.friend.username == "NekoShadow";
		});
		expect(targetFriend).toBeDefined();
		if (!targetFriend) return;
		render(
			<CWebsocket>
				<PFriendChat targetFriend={targetFriend.friend}></PFriendChat>
			</CWebsocket>,
		);

		await waitFor(
			() => {
				expect(screen.getByText("Yeah that's damm big")).toBeInTheDocument();
			},
			{ timeout: 12500 },
		);

		const searchField = screen.getByTestId("PFriendChat_NewMessage");
		const sendButton = screen.getByTestId("PFriendChat_SendButton");
		expect(searchField).toBeInTheDocument();
		const input = within(searchField).getByRole("textbox");

		await userEvent.type(input, "Hello my friend");
		await userEvent.click(sendButton);
		await waitFor(() => {
			expect((input as HTMLInputElement).value).toEqual("");

			const allChatNodes = screen.getAllByTestId("PFriendChatNode");
			expect(allChatNodes.length).greaterThan(0);

			const foundChat = allChatNodes.find((El: HTMLElement) => {
				return within(El).getByText("Hello my friend");
			});
			expect(foundChat).toBeInTheDocument();
			if (!foundChat) return;
			expect(screen.getByTestId("CheckIcon")).toBeInTheDocument();
		});

		await waitFor(
			() => {
				const allChatNodes = screen.getAllByTestId("PFriendChatNode");
				const foundChat = allChatNodes.find((El: HTMLElement) => {
					return within(El).getByText("Hello my friend");
				});
				expect(foundChat).toBeInTheDocument();
				if (!foundChat) return;
				const icon = within(foundChat).getByTestId("DoneAllIcon");
				expect(icon).toBeInTheDocument();
				expect(window.getComputedStyle(icon).color == "rgb(0, 0, 0)");
			},
			{ timeout: 3000 },
		);

		await waitFor(
			() => {
				const allChatNodes = screen.getAllByTestId("PFriendChatNode");
				const foundChat = allChatNodes.find((El: HTMLElement) => {
					return within(El).getByText("Hello my friend");
				});
				expect(foundChat).toBeInTheDocument();
				if (!foundChat) return;
				const icon = within(foundChat).getByTestId("DoneAllIcon");
				expect(icon).toBeInTheDocument();
				expect(window.getComputedStyle(icon).color != "rgb(0, 0, 0)");
			},
			{ timeout: 3000 },
		);

		await waitFor(
			() => {
				const allChatNodes = screen.getAllByTestId("PFriendChatNode");
				const foundChat = allChatNodes.find((El: HTMLElement) => {
					return within(El).getByText("hey, how you doing ?");
				});
				expect(foundChat).toBeInTheDocument();
				if (!foundChat) return;
				expect(
					within(foundChat).queryByTestId(/AccessTimeIcon|CheckIcon|DoneAllIcon/),
				).not.toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});
