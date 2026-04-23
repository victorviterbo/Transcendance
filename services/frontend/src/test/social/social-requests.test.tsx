import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { API_SOCIAL_FRIENDS_REQUEST, API_SOCIAL_FRIENDS_SEARCH } from "../../constants";
import type { IFriendRequests } from "../../types/socials";
import PFriendReq from "../../pages/PSocial/PFriendReq";
import { mockGetExtUser } from "../../mock/handlers/social/social_dbs";
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

describe("Socials - Friend requests", () => {
	afterEach(() => {
		vi.resetAllMocks();
		getMock.mockReset();
		postMock.mockReset();

		accessToken = null;
	});

	//LIST
	it.each(["incoming", "outgoing"])("Check for empty (%s)", async (value) => {
		const data: IFriendRequests = {
			incoming: [],
			outgoing: [],
		};

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS_SEARCH) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(
			<CWebsocket>
				<PFriendReq />
			</CWebsocket>,
		);
		expect(screen.getByTestId("PFriendReq_" + value).childElementCount).toEqual(1);
		expect(screen.getByText("SOCIAL_NO_" + value.toLocaleUpperCase())).toBeInTheDocument();
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});
	it("Check for error", async () => {
		getMock.mockImplementation((url: string) => {
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(
			<CWebsocket>
				<PFriendReq />
			</CWebsocket>,
		);

		await waitFor(() => {
			expect(screen.getAllByText("SOCIAL_REQUESTS_ERROR").length).toEqual(2);
		});
		expect(screen.queryByTestId("PFriendNode")).not.toBeInTheDocument();
	});

	it.each([
		[5, 3],
		[2, 0],
		[0, 6],
		[6, 7],
	])("Check lists (%d Incoming - %d Outging)", async (Incoming, Outgoing) => {
		const data: IFriendRequests = {
			incoming: [],
			outgoing: [],
		};

		for (let i = 0; i < Incoming; i++) {
			data.incoming.push(structuredClone(mockGetExtUser(i)));
			data.incoming[i].relation = "incoming";
		}

		for (let i = 0; i < Outgoing; i++) {
			data.outgoing.push(structuredClone(mockGetExtUser(i)));
			data.outgoing[i].relation = "outgoing";
		}

		getMock.mockImplementation((url: string) => {
			if (url === API_SOCIAL_FRIENDS_REQUEST) {
				return Promise.resolve({
					data,
				});
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(
			<CWebsocket>
				<PFriendReq />
			</CWebsocket>,
		);

		const incomingStack = screen.getByTestId("PFriendReq_incoming");
		const outgoingStack = screen.getByTestId("PFriendReq_outgoing");
		expect(incomingStack).toBeInTheDocument();
		expect(outgoingStack).toBeInTheDocument();

		await waitFor(() => {
			if (Incoming > 0) {
				expect(within(incomingStack).getAllByTestId("PFriendNode").length).toEqual(
					Incoming,
				);
				expect(
					within(incomingStack).getAllByTestId("PFriendNode_ValidButton").length,
				).toEqual(Incoming);
				expect(
					within(incomingStack).getAllByTestId("PFriendNode_CancelButton").length,
				).toEqual(Incoming);
			} else
				expect(within(incomingStack).getByText("SOCIAL_NO_INCOMING")).toBeInTheDocument();

			if (Outgoing > 0) {
				expect(within(outgoingStack).getAllByTestId("PFriendNode").length).toEqual(
					Outgoing,
				);
				expect(within(outgoingStack).getAllByTestId("PFriendNode_Sent").length).toEqual(
					Outgoing,
				);
			} else
				expect(within(outgoingStack).getByText("SOCIAL_NO_OUTGOING")).toBeInTheDocument();
		});
	});
});
