import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { API_SOCIAL_FRIENDS } from "../../constants";
import userEvent from "@testing-library/user-event";
import type { IFriendsList } from "../../types/friends";
import { mockGenerateFriend } from "../../mock/handlers/social";
import PFriendList from "../../pages/PSocial/PFriendList";

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

describe("Socials - Friend list", () => {
	afterEach(() => {
		vi.resetAllMocks();
		getMock.mockReset();
		postMock.mockReset();

		accessToken = null;
	});

	//LIST
	it("Check for no friends", async () => {
		const data: IFriendsList = {
			friends: [],
		};

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);

		await waitFor(() => {
			expect(screen.getByText("FRIEND_EMPTY")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});
	it("Check for error", async () => {
		getMock.mockImplementation((url: string) => {
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);

		await waitFor(() => {
			expect(screen.getByText("FRIEND_ERROR")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});
	it("Check for 10 friends", async () => {
		const data: IFriendsList = {
			friends: [],
		};
		for (let i = 0; i < 10; i++) data.friends.push(mockGenerateFriend());

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode").length).toEqual(10);
		});
	});
	it("Check for Randoms friends", async () => {
		const count = Math.round(Math.random() * 100);
		const data: IFriendsList = {
			friends: [],
		};
		for (let i = 0; i < count; i++) data.friends.push(mockGenerateFriend());

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode").length).toEqual(count);
		});
	});

	it("Check friend nodes have correct type input", async () => {
		const data: IFriendsList = {
			friends: [],
		};
		for (let i = 0; i < 10; i++) data.friends.push(mockGenerateFriend());

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode_MessageButton").length).toEqual(10);
		});
	});
	it("Check for search input", async () => {
		const data: IFriendsList = {
			friends: [],
		};
		for (let i = 0; i < 10; i++) data.friends.push(mockGenerateFriend());
		data.friends[0].username = "test";
		data.friends[5].username = "TEst";

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);
		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode").length).toEqual(10);
		});

		const searchField = screen.getByTestId("PSocialSearchList");
		expect(searchField).toBeInTheDocument();
		const input = within(searchField).getByRole("textbox");

		await userEvent.type(input, "Test");

		await waitFor(
			() => {
				const len = screen
					.getAllByTestId("PFriendNode")
					.filter((el) => el.classList.contains("MuiCollapse-entered")).length;
				expect(len).toEqual(2);
			},
			{ timeout: 1000 },
		);
	});
});
