import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { API_SOCIAL_FRIENDS } from "../../constants";
import userEvent from "@testing-library/user-event";
import type { IFriendsList } from "../../types/friends";
import PFriendList from "../../pages/PSocial/PFriendList";
import { mockSocialDB, mockSocialResetDB } from "../../mock/dbs/social_dbs";

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
	beforeEach(() => {
		mockSocialResetDB();
	});

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
	it("Check for friends", async () => {
		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({ data: { friends: mockSocialDB.friends } });
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode").length).toEqual(5);
		});
	});

	it("Check friend nodes have correct type input", async () => {
		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({ data: { friends: mockSocialDB.friends } });
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode_MessageButton").length).toEqual(5);
		});
	});
	it("Check for search input", async () => {
		mockSocialDB.friends[0].username = "test";
		mockSocialDB.friends[4].username = "TEst";

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS) {
				return Promise.resolve({ data: { friends: mockSocialDB.friends } });
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendList />);
		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode").length).toEqual(5);
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
