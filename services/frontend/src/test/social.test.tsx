import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CAuthProvider } from "../components/auth/CAuthProvider";
import { API_AUTH_REFRESH, API_SOCIAL_FRIENDS } from "../constants";
import GPageBase from "../pages/common/GPageBases";
import userEvent from "@testing-library/user-event";
import PSocial from "../pages/PSocial";
import type { IFriendInfo, IFriendsList } from "../types/friends";
import { mockGenerateFriend } from "../mock/handlers/social";
import PFriendNode from "../pages/PSocial/PFriendNode";

const getMock = vi.fn();
const postMock = vi.fn();
let accessToken: string | null = null;

vi.mock("../api", () => ({
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

function logUser() {
	postMock.mockImplementation((url: string) => {
		if (url === API_AUTH_REFRESH) {
			return Promise.resolve({
				data: { access: "test-access", username: "john" },
			});
		}
		return Promise.reject(new Error(`unexpected call: ${url}`));
	});
}

describe("Socials", () => {
	afterEach(() => {
		vi.resetAllMocks();
		getMock.mockReset();
		postMock.mockReset();

		accessToken = null;
	});

	//DRAWER
	it("DRAWER: Friends panel when not logged in", async () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<GPageBase />
			</MemoryRouter>,
		);

		expect(screen.queryByTestId("PSocial")).toBeNull();
	});

	it("DRAWER: Friends panel when logged in", async () => {
		logUser();
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<GPageBase />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId("PSocial")).toBeInTheDocument();
		});
	});

	it("DRAWER: Friends panel closed by default", async () => {
		logUser();
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<GPageBase />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId("PSocial")).toBeInTheDocument();
			expect(screen.queryByTestId("PSocialDrawer")).toBeInTheDocument();
		});

		const firstChild = screen.queryByTestId("PSocialDrawer")?.children[0];
		expect(firstChild).not.toBeNull();
		expect(firstChild).not.toBeVisible();
	});

	it("DRAWER: Opening friends panel", async () => {
		logUser();
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<GPageBase />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId("PSocial")).toBeInTheDocument();
			expect(screen.queryByTestId("PSocialDrawer")).toBeInTheDocument();
		});

		const firstChild = screen.queryByTestId("PSocialDrawer")?.children[0];
		expect(firstChild).not.toBeNull();
		expect(firstChild).not.toBeVisible();

		const button = screen.getByTestId("Friends_CIconButton");

		await userEvent.click(button);

		expect(firstChild).toBeVisible();
	});

	//LIST
	it("LIST: Check for no friends", async () => {
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

		render(<PSocial />);

		await waitFor(() => {
			expect(screen.getByText("FRIEND_EMPTY")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});
	it("LIST: Check for error", async () => {
		getMock.mockImplementation((url: string) => {
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PSocial />);

		await waitFor(() => {
			expect(screen.getByText("FRIEND_ERROR")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});
	it("LIST: Check for 10 friends", async () => {
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

		render(<PSocial />);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode").length).toEqual(10);
		});
	});
	it("LIST: Check for Randoms friends", async () => {
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

		render(<PSocial />);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode").length).toEqual(count);
		});
	});

	it("LIST: Check for search input", async () => {
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

		render(<PSocial />);
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

	//FRIEND NODE
	it("FRIEND NODE: Check for base data", async () => {
		const user: IFriendInfo = mockGenerateFriend();

		render(<PFriendNode user={user} type="friend" />);

		expect(screen.getByText(user.username)).toBeInTheDocument();
		expect(screen.getByText(user.badges)).toBeInTheDocument();
	});

	it("FRIEND NODE: Check for color status", async () => {
		const users: IFriendInfo[] = [
			mockGenerateFriend(),
			mockGenerateFriend(),
			mockGenerateFriend(),
			mockGenerateFriend(),
		];

		users.forEach((user: IFriendInfo, index: number) => {
			user.username = "test_" + index;
		});

		users[0].status = "online";
		users[1].status = "busy";
		users[2].status = "offline";
		users[3].status = "online";

		render(
			<>
				<PFriendNode user={users[0]} type="friend" />
				<PFriendNode user={users[1]} type="friend" />
				<PFriendNode user={users[2]} type="friend" />
				<PFriendNode user={users[3]} type="friend" />
			</>,
		);

		const allNodes = screen.getAllByTestId("PFriendNode");
		expect(allNodes.length).toEqual(4);

		const allBoxes = allNodes.map((El) => {
			return within(El).getByTestId("PFriendNodeBox");
		});
		expect(allBoxes.length).toEqual(4);
		const allBG = allBoxes.map((El) => {
			return window.getComputedStyle(El).background;
		});
		expect(allBG[0] !== allBG[1]).toBeTruthy();
		expect(allBG[0] !== allBG[2]).toBeTruthy();
		expect(allBG[1] !== allBG[2]).toBeTruthy();
		expect(allBG[0] === allBG[3]).toBeTruthy();
	});
});
