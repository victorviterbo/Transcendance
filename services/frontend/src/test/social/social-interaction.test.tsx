import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { IFriendReqSend, IFriendRequests } from "../../types/friends";
import PFriendNode from "../../pages/PSocial/PFriendNode";
import type { IExtUserInfo, IExtUserList, IExtUserSearch } from "../../types/user";
import {
	API_SOCIAL_FRIENDS_REQUEST,
	API_SOCIAL_FRIENDS_REQUEST_SEND,
	API_SOCIAL_FRIENDS_SEARCH,
} from "../../constants";
import userEvent from "@testing-library/user-event";
import {
	mockGetExtUser,
	mockGetExtUsers,
	mockGetRequests,
	mockOnAddRequestSend,
	mockSocialResetDB,
} from "../../mock/dbs/social_dbs";
import type { IErrorReturn } from "../../types/error";
import PSocial from "../../pages/PSocial";

const getMock = vi.fn();
const postMock = vi.fn();
let accessToken: string | null = null;

vi.mock("../../api", () => ({
	default: {
		get: (...args: unknown[]) => getMock(...args),
		post: (...args: unknown[]) => postMock(...args),
	},
	setAccessToken: (token: string | null) => {
		accessToken = token;
	},
	clearAccessToken: () => {
		accessToken = null;
	},
	getAccessToken: () => accessToken,
	setAuthFailureHandler: (_: (() => void) | null) => {},
}));

describe("Socials - Interactions", () => {
	beforeEach(() => {
		mockSocialResetDB();
	});

	afterEach(() => {
		vi.resetAllMocks();
		getMock.mockReset();
		postMock.mockReset();

		accessToken = null;
	});

	//ADD FRIENDS
	it("Pressing add friend button", async () => {
		const user: IExtUserInfo = mockGetExtUser(4);
		user.image = "";

		postMock.mockImplementation((url: string, body) => {
			if (url == API_SOCIAL_FRIENDS_REQUEST_SEND) {
				const data: IFriendReqSend = typeof body == "string" ? JSON.parse(body) : body;
				const out: IExtUserInfo | IErrorReturn = mockOnAddRequestSend(data);
				if ("error" in out) return Promise.reject(new Error(`unexpected call: ${url}`));
				const user: IExtUserInfo = out as IExtUserInfo;
				user.relation = "outgoing";
				return Promise.resolve({
					data: {
						"target-username": user.username,
						"target-uid": user.uid,
						description: "FRIENDSHIP_REQUEST_SENT",
					},
				});
			}
		});

		render(<PFriendNode user={user} type="user" />);
		const addButton = screen.getByTestId("PFriendNode_AddButton");
		expect(addButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByTestId("PFriendNode_Sent")).toBeInTheDocument();
		});
	});

	it("Pressing add friend button (ERROR)", async () => {
		const user: IExtUserInfo = mockGetExtUser(4);
		user.image = "";

		postMock.mockImplementation((url: string, body) => {
			if (url == API_SOCIAL_FRIENDS_REQUEST_SEND) {
				const data: IFriendReqSend = typeof body == "string" ? JSON.parse(body) : body;
				const out: IExtUserInfo | IErrorReturn = mockOnAddRequestSend(data);
				if ("error" in out) return Promise.reject(new Error(`unexpected call: ${url}`));
				const user: IExtUserInfo = out as IExtUserInfo;
				user.relation = "outgoing";
				return Promise.reject(new Error(`unexpected call: ${url}`));
			}
		});

		render(<PFriendNode user={user} type="user" />);
		const addButton = screen.getByTestId("PFriendNode_AddButton");
		expect(addButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(screen.queryByTestId("PFriendNode_Sent")).not.toBeInTheDocument();
		});
	});

	it.each([
		["a", 5, "Dua_"],
		["a", 5, "Ava"],
		["john", 3, "John99"],
		["h", 4, "John74"],
	])(
		"Checking friends management (Searching: %s (%d), Traget: %s)",
		async (search: string, expected: number, target: string) => {
			const user: IExtUserInfo = mockGetExtUser(4);
			user.image = "";

			postMock.mockImplementation((url: string, body) => {
				if (url == API_SOCIAL_FRIENDS_REQUEST_SEND) {
					const data: IFriendReqSend = typeof body == "string" ? JSON.parse(body) : body;
					const out: IExtUserInfo | IErrorReturn = mockOnAddRequestSend(data);
					if ("error" in out) return Promise.reject(new Error(`unexpected call: ${url}`));
					const user: IExtUserInfo = out as IExtUserInfo;
					user.relation = "outgoing";
					return Promise.resolve({
						data: {
							"target-username": user.username,
							"target-uid": user.uid,
							description: "FRIENDSHIP_REQUEST_SENT",
						},
					});
				}

				if (url === API_SOCIAL_FRIENDS_SEARCH) {
					const input: IExtUserSearch = typeof body == "string" ? JSON.parse(body) : body;
					const data: IExtUserList = mockGetExtUsers(input.search);
					return Promise.resolve({
						data,
					});
				}
				return Promise.reject(new Error(`unexpected call: ${url}`));
			});

			getMock.mockImplementation((url: string) => {
				if (url == API_SOCIAL_FRIENDS_REQUEST) {
					const data: IFriendRequests = mockGetRequests();
					return Promise.resolve({ data });
				}
				return Promise.reject(new Error(`unexpected call: ${url}`));
			});

			render(<PSocial />);

			//BUTTONS
			const listButton = screen.getByTestId("PSocialTab0");
			const addButton = screen.getByTestId("PSocialTab1");
			const reqButton = screen.getByTestId("PSocialTab2");
			expect(listButton).toBeInTheDocument();
			expect(addButton).toBeInTheDocument();
			expect(reqButton).toBeInTheDocument();

			await userEvent.click(addButton);

			await waitFor(() => {
				expect(screen.queryByTestId("PFriendList")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendAdd")).toBeInTheDocument();
				expect(screen.queryByTestId("PFriendReq")).not.toBeInTheDocument();
			});

			//Search for users
			const searchField = screen.getByTestId("PSocialASearchAdd");
			expect(searchField).toBeInTheDocument();
			const input = within(searchField).getByRole("textbox");
			await userEvent.type(input, search);

			await waitFor(() => {
				if (expected > 0)
					expect(screen.getAllByTestId("PFriendNode").length).toEqual(expected);
				else expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
			});

			let userNode: HTMLElement | null = null;
			screen.getAllByTestId("PFriendNode").forEach((value: HTMLElement) => {
				if (within(value).queryByText(target)) userNode = value;
			});
			expect(userNode).toBeInTheDocument();

			//Assking for friendship
			if (userNode == null) throw "Error";

			const userAddButton = within(userNode).getByTestId("PFriendNode_AddButton");
			expect(userAddButton).toBeInTheDocument();

			await userEvent.click(userAddButton);

			await waitFor(() => {
				screen.getAllByTestId("PFriendNode").forEach((value: HTMLElement) => {
					if (within(value).queryByText(target)) userNode = value;
				});

				if (userNode == null) throw "Error";
				expect(within(userNode).getByTestId("PFriendNode_Sent")).toBeInTheDocument();
				expect(
					within(userNode).queryByTestId("PFriendNode_AddButton"),
				).not.toBeInTheDocument();
			});

			//SWICTHING TO REQUESTS
			await userEvent.click(reqButton);

			await waitFor(() => {
				expect(screen.queryByTestId("PFriendList")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendAdd")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendReq")).toBeInTheDocument();
			});

			const incomingStack = screen.getByTestId("PFriendReq_incoming");
			const outgoingStack = screen.getByTestId("PFriendReq_outgoing");
			expect(incomingStack).toBeInTheDocument();
			expect(outgoingStack).toBeInTheDocument();

			expect(within(incomingStack).getAllByTestId("PFriendNode").length).toEqual(2);
			expect(within(outgoingStack).getAllByTestId("PFriendNode").length).toEqual(2);
			expect(within(outgoingStack).getByText(target)).toBeInTheDocument();
		},
	);
});
