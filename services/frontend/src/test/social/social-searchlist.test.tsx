import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { API_SOCIAL_FRIENDS_SEARCH } from "../../constants";
import type { IExtUserList, IExtUserSearch } from "../../types/user";
import PFriendAdd from "../../pages/PSocial/PFriendAdd";
import userEvent from "@testing-library/user-event";
import { mockGetExtUsers } from "../../mock/handlers/social";

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
	it("Check for empty search", async () => {
		const data: IExtUserList = {
			users: [],
		};

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS_SEARCH) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendAdd />);
		expect(screen.getByTestId("PFriendAdd_Stack").childElementCount).toEqual(0);
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});
	it("Check for error", async () => {
		getMock.mockImplementation((url: string) => {
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendAdd />);

		const searchField = screen.getByTestId("PSocialASearchAdd");
		expect(searchField).toBeInTheDocument();
		const input = within(searchField).getByRole("textbox");
		await userEvent.type(input, "Test");

		await waitFor(() => {
			expect(screen.getByText("USERS_ADD_EROOR")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});
	it("Check search", async () => {
		postMock.mockImplementation((url: string, body: unknown) => {
			const input: IExtUserSearch = typeof body == "string" ? JSON.parse(body) : body;
			const data: IExtUserList = mockGetExtUsers(input.search);
			if (url === API_SOCIAL_FRIENDS_SEARCH) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendAdd />);

		const searchField = screen.getByTestId("PSocialASearchAdd");
		expect(searchField).toBeInTheDocument();
		const input = within(searchField).getByRole("textbox");
		await userEvent.type(input, "john100");

		await waitFor(() => {
			expect(screen.getByText("USERS_NOTFOUND")).toBeInTheDocument();
		});
	});
	it.each([
		["john", 3],
		["a", 5],
		["_", 1],
		["heeqwdwqllo", 0],
	])("Check searches for %s (expect: %i)", async (search: string, expected: number) => {
		postMock.mockImplementation((url: string, body: unknown) => {
			const input: IExtUserSearch = typeof body == "string" ? JSON.parse(body) : body;
			const data: IExtUserList = mockGetExtUsers(input.search);
			if (url === API_SOCIAL_FRIENDS_SEARCH) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendAdd />);

		const searchField = screen.getByTestId("PSocialASearchAdd");
		expect(searchField).toBeInTheDocument();
		const input = within(searchField).getByRole("textbox");
		await userEvent.type(input, search);

		await waitFor(() => {
			if (expected > 0) expect(screen.getAllByTestId("PFriendNode").length).toEqual(expected);
			else expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
		});
	});

	it.each([
		["john", 3],
		["a", 5],
		["_", 1],
		["heeqwdwqllo", 0],
	])("Check searches types for %s (expect: %i)", async (search: string, expected: number) => {
		postMock.mockImplementation((url: string, body: unknown) => {
			const input: IExtUserSearch = typeof body == "string" ? JSON.parse(body) : body;
			const data: IExtUserList = mockGetExtUsers(input.search);
			if (url === API_SOCIAL_FRIENDS_SEARCH) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(<PFriendAdd />);

		const searchField = screen.getByTestId("PSocialASearchAdd");
		expect(searchField).toBeInTheDocument();
		const input = within(searchField).getByRole("textbox");
		await userEvent.type(input, search);

		await waitFor(() => {
			if (expected > 0)
				expect(screen.getAllByTestId("PFriendNode_AddButton").length).toEqual(expected);
			else expect(screen.queryByTestId("PFriendNode_AddButton")).not.toBeInTheDocument();
		});
	});

	it.each([["hello"], ["hello world"], ["This is a very long serach string"]])(
		"Check searches counts for %s",
		async (value: string) => {
			let searchCount = 0;
			postMock.mockImplementation((url: string, body: unknown) => {
				searchCount++;
				const input: IExtUserSearch = typeof body == "string" ? JSON.parse(body) : body;
				const data: IExtUserList = mockGetExtUsers(input.search);
				if (url === API_SOCIAL_FRIENDS_SEARCH) {
					return Promise.resolve({
						data,
					});
				}
				return Promise.reject(new Error(`unexpected call: ${url}`));
			});

			render(<PFriendAdd />);

			const searchField = screen.getByTestId("PSocialASearchAdd");
			expect(searchField).toBeInTheDocument();
			const input = within(searchField).getByRole("textbox");

			await userEvent.clear(input);
			await userEvent.type(input, value);

			await waitFor(() => {
				expect(searchCount).toBeLessThanOrEqual(value.length / 0.25);
			});
		},
	);
});
