import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { IFriendInfo } from "../../types/friends";
import { mockGenerateFriend, mockGetExtUser } from "../../mock/handlers/social";
import PFriendNode from "../../pages/PSocial/PFriendNode";
import type { IExtUserInfo } from "../../types/user";

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

describe("Socials - Friend/user node", () => {
	afterEach(() => {
		vi.resetAllMocks();
		getMock.mockReset();
		postMock.mockReset();

		accessToken = null;
	});

	//FRIEND NODE
	it("Check for base data (friend)", async () => {
		const user: IFriendInfo = mockGenerateFriend();

		render(<PFriendNode user={user} type="friend" />);

		expect(screen.getByText(user.username)).toBeInTheDocument();
		expect(screen.getByText(user.badges)).toBeInTheDocument();
	});
	it("Check for base data (user)", async () => {
		const user: IExtUserInfo = mockGetExtUser(0);

		render(<PFriendNode user={user} type="user" />);

		expect(screen.getByText(user.username)).toBeInTheDocument();
		expect(screen.getByText(user.badges)).toBeInTheDocument();
	});

	it("Check unique type data (friend)", async () => {
		const user: IFriendInfo = mockGenerateFriend();

		render(<PFriendNode user={user} type="friend" />);

		expect(screen.getByTestId("PFriendNode_MessageButton")).toBeInTheDocument();
		expect(screen.queryByTestId("PFriendNode_AddButton")).not.toBeInTheDocument();
	});
	it("Check for base data (user)", async () => {
		const user: IExtUserInfo = mockGetExtUser(0);

		render(<PFriendNode user={user} type="user" />);

		expect(screen.getByTestId("PFriendNode_AddButton")).toBeInTheDocument();
		expect(screen.queryByTestId("PFriendNode_MessageButton")).not.toBeInTheDocument();
	});

	it("Check for color status (friend)", async () => {
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

	it("Check for color status (user)", async () => {
		const users: IExtUserInfo[] = [
			mockGetExtUser(0),
			mockGetExtUser(1),
			mockGetExtUser(2),
			mockGetExtUser(3),
		];

		users.forEach((user: IExtUserInfo, index: number) => {
			user.username = "test_" + index;
		});

		render(
			<>
				<PFriendNode user={users[0]} type="user" />
				<PFriendNode user={users[1]} type="user" />
				<PFriendNode user={users[2]} type="user" />
				<PFriendNode user={users[3]} type="user" />
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
		expect(allBG[0] === allBG[1]).toBeTruthy();
		expect(allBG[0] === allBG[2]).toBeTruthy();
		expect(allBG[1] === allBG[2]).toBeTruthy();
		expect(allBG[0] === allBG[3]).toBeTruthy();
	});
});
