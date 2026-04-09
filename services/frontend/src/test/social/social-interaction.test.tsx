import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import type {
	IFriendInfo,
	IFriendReqRes,
	IFriendReqSend,
	IFriendRequests,
} from "../../types/friends";
import PFriendNode from "../../pages/PSocial/PFriendNode";
import type { IExtUserInfo, IExtUserList, IExtUserSearch } from "../../types/user";
import {
	API_SOCIAL_FRIENDS,
	API_SOCIAL_FRIENDS_REQUEST,
	API_SOCIAL_FRIENDS_REQUEST_RESPOND,
	API_SOCIAL_FRIENDS_REQUEST_SEND,
	API_SOCIAL_FRIENDS_SEARCH,
} from "../../constants";
import userEvent from "@testing-library/user-event";
import {
	mockGetExtUser,
	mockGetExtUsers,
	mockGetRequests,
	mockOnAddRequestSend,
	mockSocialDB,
	mockSocialOnResponse,
	mockSocialResetDB,
} from "../../mock/handlers/social/social_dbs";
import type { IErrorReturn } from "../../types/error";
import PSocial from "../../pages/PSocial";
import CWebsocket from "../../components/websocket/CWebsocket";

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
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendNode user={user} type="user" />);
		const addButton = screen.getByTestId("PFriendNode_AddButton");
		expect(addButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(screen.queryByTestId("PFriendNode_Sent")).not.toBeInTheDocument();
		});
	});

	//ACCEPT FRIENDS
	it("Pressing accept requests button", async () => {
		const user: IExtUserInfo = mockGetExtUser(4);
		user.image = "";
		user.relation = "incoming";

		let stateValid: boolean = false;
		let gotAccepted: boolean = false;

		postMock.mockImplementation((url: string, body) => {
			if (url == API_SOCIAL_FRIENDS_REQUEST_RESPOND) {
				const data: IFriendReqRes = typeof body == "string" ? JSON.parse(body) : body;
				if (data["new-status"] == "accept") gotAccepted = true;
				const out: IExtUserInfo | IFriendInfo | IErrorReturn = mockSocialOnResponse(data);
				if ("error" in out) return Promise.reject(new Error(`unexpected call: ${url}`));
				if ("created_at" in out) {
					const user: IFriendInfo = out as IFriendInfo;
					return Promise.resolve({
						data: {
							"target-username": user.username,
							"target-uid": user.uid,
							description: "FRIENDSHIP_REQUEST_SENT",
						},
					});
				}
				const user: IExtUserInfo = out as IExtUserInfo;
				return Promise.resolve({
					data: {
						"target-username": user.username,
						"target-uid": user.uid,
						description: "FRIENDSHIP_REQUEST_SENT",
					},
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(
			<PFriendNode
				user={user}
				type="user"
				onStateChanged={() => {
					stateValid = true;
				}}
			/>,
		);
		const addButton = screen.getByTestId("PFriendNode_ValidButton");
		expect(addButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(stateValid).toEqual(true);
			expect(gotAccepted).toEqual(true);
		});
	});
	it("Pressing accept requests button (ERROR)", async () => {
		const user: IExtUserInfo = mockGetExtUser(4);
		user.image = "";
		user.relation = "incoming";

		postMock.mockImplementation((url: string) => {
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendNode user={user} type="user" />);
		const addButton = screen.getByTestId("PFriendNode_ValidButton");
		expect(addButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByText("SOCIAL_RESPOND_FRIEND_FAILED")).toBeInTheDocument();
		});
	});

	//REFUSE FRIENDS
	it("Pressing refuse requests button", async () => {
		const user: IExtUserInfo = mockGetExtUser(4);
		user.image = "";
		user.relation = "incoming";

		let stateValid: boolean = false;
		let gotRefused: boolean = false;

		postMock.mockImplementation((url: string, body) => {
			if (url == API_SOCIAL_FRIENDS_REQUEST_RESPOND) {
				const data: IFriendReqRes = typeof body == "string" ? JSON.parse(body) : body;
				if (data["new-status"] == "refuse") gotRefused = true;
				const out: IExtUserInfo | IFriendInfo | IErrorReturn = mockSocialOnResponse(data);
				if ("error" in out) return Promise.reject(new Error(`unexpected call: ${url}`));
				if ("created_at" in out) {
					const user: IFriendInfo = out as IFriendInfo;
					return Promise.resolve({
						data: {
							"target-username": user.username,
							"target-uid": user.uid,
							description: "FRIENDSHIP_REQUEST_SENT",
						},
					});
				}
				const user: IExtUserInfo = out as IExtUserInfo;
				return Promise.resolve({
					data: {
						"target-username": user.username,
						"target-uid": user.uid,
						description: "FRIENDSHIP_REQUEST_SENT",
					},
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(
			<PFriendNode
				user={user}
				type="user"
				onStateChanged={() => {
					stateValid = true;
				}}
			/>,
		);
		const addButton = screen.getByTestId("PFriendNode_CancelButton");
		expect(addButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(stateValid).toEqual(true);
			expect(gotRefused).toEqual(true);
		});
	});
	it("Pressing refuse requests button (ERROR)", async () => {
		const user: IExtUserInfo = mockGetExtUser(4);
		user.image = "";
		user.relation = "incoming";

		postMock.mockImplementation((url: string) => {
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendNode user={user} type="user" />);
		const addButton = screen.getByTestId("PFriendNode_CancelButton");
		expect(addButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByText("SOCIAL_RESPOND_FRIEND_FAILED")).toBeInTheDocument();
		});
	});

	//FULL TESTS
	it.each([
		["a", 18, "Dua_"],
		["a", 18, "Ava"],
		["john", 3, "John99"],
		["h", 11, "John74"],
	])(
		"Checking friends request (Searching: %s (%d), Traget: %s)",
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

			render(
				<CWebsocket>
					<PSocial />
				</CWebsocket>,
			);

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

			expect(within(incomingStack).getAllByTestId("PFriendNode").length).toEqual(4);
			expect(within(outgoingStack).getAllByTestId("PFriendNode").length).toEqual(4);
			expect(within(outgoingStack).getByText(target)).toBeInTheDocument();
		},
	);

	//FULL ACCEPTED
	it.each([["PixelFox"], ["NightOwl"], ["たけし"], ["さくら"]])(
		"Checking Firends accept globally (Traget: %s)",
		async (target: string) => {
			const user: IExtUserInfo = mockGetExtUser(4);
			user.image = "";

			postMock.mockImplementation((url: string, body) => {
				if (url === API_SOCIAL_FRIENDS_SEARCH) {
					const input: IExtUserSearch = typeof body == "string" ? JSON.parse(body) : body;
					const data: IExtUserList = mockGetExtUsers(input.search);
					return Promise.resolve({
						data,
					});
				} else if (url == API_SOCIAL_FRIENDS_REQUEST_RESPOND) {
					const data: IFriendReqRes = typeof body == "string" ? JSON.parse(body) : body;
					const out: IExtUserInfo | IFriendInfo | IErrorReturn =
						mockSocialOnResponse(data);
					if ("error" in out) return Promise.reject(new Error(`unexpected call: ${url}`));
					if ("created_at" in out) {
						const user: IFriendInfo = out as IFriendInfo;
						return Promise.resolve({
							data: {
								"target-username": user.username,
								"target-uid": user.uid,
								description: "FRIENDSHIP_REQUEST_SENT",
							},
						});
					}
					const user: IExtUserInfo = out as IExtUserInfo;
					return Promise.resolve({
						data: {
							"target-username": user.username,
							"target-uid": user.uid,
							description: "FRIENDSHIP_REQUEST_SENT",
						},
					});
				}
				return Promise.reject(new Error(`unexpected call: ${url}`));
			});

			getMock.mockImplementation((url: string) => {
				if (url == API_SOCIAL_FRIENDS_REQUEST) {
					const data: IFriendRequests = mockGetRequests();
					return Promise.resolve({ data });
				}
				if (url == API_SOCIAL_FRIENDS) {
					return Promise.resolve({ data: { friends: mockSocialDB.friends } });
				}
				return Promise.reject(new Error(`unexpected call: ${url}`));
			});

			render(
				<CWebsocket>
					<PSocial />
				</CWebsocket>,
			);

			//BUTTONS
			const listButton = screen.getByTestId("PSocialTab0");
			const addButton = screen.getByTestId("PSocialTab1");
			const reqButton = screen.getByTestId("PSocialTab2");
			expect(listButton).toBeInTheDocument();
			expect(addButton).toBeInTheDocument();
			expect(reqButton).toBeInTheDocument();

			//OPEN REQ
			await userEvent.click(reqButton);

			await waitFor(() => {
				expect(screen.queryByTestId("PFriendList")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendAdd")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendReq")).toBeInTheDocument();
			});

			//CHECKING REQ AND FINDING TARGETS
			const incomingStack = screen.getByTestId("PFriendReq_incoming");
			const outgoingStack = screen.getByTestId("PFriendReq_outgoing");
			expect(incomingStack).toBeInTheDocument();
			expect(outgoingStack).toBeInTheDocument();

			expect(within(incomingStack).getAllByTestId("PFriendNode").length).toEqual(4);
			expect(within(outgoingStack).getAllByTestId("PFriendNode").length).toEqual(3);

			let targetNode: HTMLElement | null = null;
			within(incomingStack)
				.getAllByTestId("PFriendNode")
				.forEach((el) => {
					if (within(el).queryByText(target)) targetNode = el;
				});
			expect(targetNode).toBeInTheDocument();
			if (!targetNode) throw "error";

			//VALIDATING
			const validButton = within(targetNode).getByTestId("PFriendNode_ValidButton");
			expect(validButton).toBeInTheDocument();

			await userEvent.click(validButton);

			//CHECKING TARGET IS NOT ANYMORE IN REQUESTS
			await waitFor(() => {
				let targetNode: HTMLElement | null = null;
				within(incomingStack)
					.getAllByTestId("PFriendNode")
					.forEach((el) => {
						if (within(el).queryByText(target)) targetNode = el;
					});
				expect(targetNode).not.toBeInTheDocument();
			});

			//CHECKING TARGET IS NOW IN FRIENDS LIST
			await userEvent.click(listButton);

			await waitFor(() => {
				expect(screen.queryByTestId("PFriendList")).toBeInTheDocument();
				expect(screen.queryByTestId("PFriendAdd")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendReq")).not.toBeInTheDocument();
			});

			expect(screen.getAllByTestId("PFriendNode").length).toEqual(6);
			expect(screen.getByText(target)).toBeInTheDocument();
		},
	);

	//FULL REFUSED
	it.each([
		["PixelFox", "pix", 1],
		["さくら", "さ", 1],
		["たけし", "し", 1],
		["NightOwl", "o", 9],
	])(
		"Checking Firends refuse globally (Traget: %s, Search: %s (%d))",
		async (target: string, search: string, count: number) => {
			const user: IExtUserInfo = mockGetExtUser(4);
			user.image = "";

			postMock.mockImplementation((url: string, body) => {
				if (url === API_SOCIAL_FRIENDS_SEARCH) {
					const input: IExtUserSearch = typeof body == "string" ? JSON.parse(body) : body;
					const data: IExtUserList = mockGetExtUsers(input.search);
					return Promise.resolve({
						data,
					});
				} else if (url == API_SOCIAL_FRIENDS_REQUEST_RESPOND) {
					const data: IFriendReqRes = typeof body == "string" ? JSON.parse(body) : body;
					const out: IExtUserInfo | IFriendInfo | IErrorReturn =
						mockSocialOnResponse(data);
					if ("error" in out) return Promise.reject(new Error(`unexpected call: ${url}`));
					if ("created_at" in out) {
						const user: IFriendInfo = out as IFriendInfo;
						return Promise.resolve({
							data: {
								"target-username": user.username,
								"target-uid": user.uid,
								description: "FRIENDSHIP_REQUEST_SENT",
							},
						});
					}
					const user: IExtUserInfo = out as IExtUserInfo;
					return Promise.resolve({
						data: {
							"target-username": user.username,
							"target-uid": user.uid,
							description: "FRIENDSHIP_REQUEST_SENT",
						},
					});
				}
				return Promise.reject(new Error(`unexpected call: ${url}`));
			});

			getMock.mockImplementation((url: string) => {
				if (url == API_SOCIAL_FRIENDS_REQUEST) {
					const data: IFriendRequests = mockGetRequests();
					return Promise.resolve({ data });
				}
				if (url == API_SOCIAL_FRIENDS) {
					return Promise.resolve({ data: { friends: mockSocialDB.friends } });
				}
				return Promise.reject(new Error(`unexpected call: ${url}`));
			});

			render(
				<CWebsocket>
					<PSocial />
				</CWebsocket>,
			);

			//BUTTONS
			const listButton = screen.getByTestId("PSocialTab0");
			const addButton = screen.getByTestId("PSocialTab1");
			const reqButton = screen.getByTestId("PSocialTab2");
			expect(listButton).toBeInTheDocument();
			expect(addButton).toBeInTheDocument();
			expect(reqButton).toBeInTheDocument();

			//OPEN REQ
			await userEvent.click(reqButton);

			await waitFor(() => {
				expect(screen.queryByTestId("PFriendList")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendAdd")).not.toBeInTheDocument();
				expect(screen.queryByTestId("PFriendReq")).toBeInTheDocument();
			});

			//CHECKING REQ AND FINDING TARGETS
			const incomingStack = screen.getByTestId("PFriendReq_incoming");
			const outgoingStack = screen.getByTestId("PFriendReq_outgoing");
			expect(incomingStack).toBeInTheDocument();
			expect(outgoingStack).toBeInTheDocument();

			expect(within(incomingStack).getAllByTestId("PFriendNode").length).toEqual(4);
			expect(within(outgoingStack).getAllByTestId("PFriendNode").length).toEqual(3);

			let targetNode: HTMLElement | null = null;
			within(incomingStack)
				.getAllByTestId("PFriendNode")
				.forEach((el) => {
					if (within(el).queryByText(target)) targetNode = el;
				});
			expect(targetNode).toBeInTheDocument();
			if (!targetNode) throw "error";

			//VALIDATING
			const cancelButton = within(targetNode).getByTestId("PFriendNode_CancelButton");
			expect(cancelButton).toBeInTheDocument();

			await userEvent.click(cancelButton);

			//CHECKING TARGET IS NOT ANYMORE IN REQUESTS
			await waitFor(() => {
				let targetNode: HTMLElement | null = null;
				within(incomingStack)
					.getAllByTestId("PFriendNode")
					.forEach((el) => {
						if (within(el).queryByText(target)) targetNode = el;
					});
				expect(targetNode).not.toBeInTheDocument();
			});

			//SEARCH TARGET
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
				if (count > 0) expect(screen.getAllByTestId("PFriendNode").length).toEqual(count);
				else expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
			});

			await waitFor(() => {
				let targetNode: HTMLElement | null = null;
				screen.getAllByTestId("PFriendNode").forEach((el) => {
					if (within(el).queryByText(target)) targetNode = el;
				});
				expect(targetNode).toBeInTheDocument();
				if (!targetNode) throw "Error";
				expect(within(targetNode).getByTestId("PFriendNode_AddButton")).toBeInTheDocument();
			});
		},
	);
});
