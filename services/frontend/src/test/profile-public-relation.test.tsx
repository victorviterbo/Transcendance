import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PProfilePublicRelation from "../pages/PProfilePage/PProfilePublicRelation";
import type { IProfileData } from "../types/profile";
import type { TFriendRelation } from "../types/socials";
import type { IExtUserInfo } from "../types/user";

const mocks = vi.hoisted(() => ({
	authStatus: "authed",
	searchFriends: vi.fn(),
	sendFriendRequest: vi.fn(),
	respondFriendRequest: vi.fn(),
	removeFriend: vi.fn(),
}));

vi.mock("../components/auth/CAuthProvider", () => ({
	useAuth: () => ({
		status: mocks.authStatus,
	}),
}));

vi.mock("../api/social", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../api/social")>();
	return {
		...actual,
		searchFriends: (...args: unknown[]) => mocks.searchFriends(...args),
		sendFriendRequest: (...args: unknown[]) => mocks.sendFriendRequest(...args),
		respondFriendRequest: (...args: unknown[]) => mocks.respondFriendRequest(...args),
		removeFriend: (...args: unknown[]) => mocks.removeFriend(...args),
	};
});

const profile: IProfileData = {
	uid: "target-uid",
	username: "target",
	avatar: null,
	exp_points: 0,
	badges: "Badge",
	created_at: "2026-04-29T00:00:00Z",
	email: "target@example.com",
};

const createUser = (
	relation: TFriendRelation,
	overrides: Partial<IExtUserInfo> = {},
): IExtUserInfo => ({
	uid: "target-uid",
	username: "target",
	image: "/avatar.png",
	badges: "Badge",
	relation,
	...overrides,
});

const renderRelation = (
	users: IExtUserInfo[] = [],
	profileOverride: Partial<IProfileData> = {},
) => {
	mocks.searchFriends.mockResolvedValueOnce({ users });
	return render(<PProfilePublicRelation profile={{ ...profile, ...profileOverride }} />);
};

const expectNoSocialError = () => {
	expect(screen.queryByTestId("PProfilePublic_SocialError")).not.toBeInTheDocument();
};

const clickConfirmDialogButton = async (name: string) => {
	await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name }));
};

const friendshipNotFoundArrayError = {
	response: {
		data: {
			error: {
				friendship: [{ message: "friendship not found", code: "FRIENDSHIP_NOT_FOUND" }],
			},
		},
	},
};

const friendshipNotFoundStringError = {
	response: {
		data: {
			error: {
				friendship: "FRIENDSHIP_NOT_FOUND",
			},
		},
	},
};

const friendshipAlreadyExistsError = {
	response: {
		data: {
			error: {
				friendship: "FRIENDSHIP_ALREADY_EXISTS",
			},
			request_status: "pending",
		},
	},
};

const genericActionError = {
	response: {
		data: {
			error: "BROKEN_ACTION",
		},
	},
};

const genericRelationError = {
	response: {
		data: {
			error: "BROKEN_RELATION",
		},
	},
};

describe("PProfilePublicRelation", () => {
	beforeEach(() => {
		mocks.authStatus = "authed";
		mocks.searchFriends.mockReset();
		mocks.sendFriendRequest.mockReset();
		mocks.respondFriendRequest.mockReset();
		mocks.removeFriend.mockReset();
	});

	describe("initial relation loading", () => {
		it("loads relation by profile username", async () => {
			renderRelation();

			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expect(mocks.searchFriends).toHaveBeenCalledWith("target");
		});

		it("shows loading state while the relation request is pending", () => {
			mocks.searchFriends.mockReturnValueOnce(new Promise(() => {}));

			render(<PProfilePublicRelation profile={profile} />);

			expect(screen.getByText("PROFILE_SOCIAL_LOADING")).toBeInTheDocument();
		});

		it("shows not-friends actions when search has no exact match", async () => {
			renderRelation([createUser("friends", { uid: "other-uid", username: "other" })]);

			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expect(screen.queryByText("PROFILE_SOCIAL_FRIEND")).not.toBeInTheDocument();
		});

		it("matches relation by uid even if the username has changed", async () => {
			renderRelation([createUser("friends", { username: "renamed-target" })]);

			expect(await screen.findByText("PROFILE_SOCIAL_FRIEND")).toBeInTheDocument();
			expect(screen.getByTestId("PProfilePublic_RemoveFriend")).toBeInTheDocument();
		});

		it("matches relation by username when the profile uid is stale", async () => {
			renderRelation([createUser("outgoing", { uid: "fresh-backend-uid" })]);

			expect(await screen.findByText("PROFILE_SOCIAL_REQUEST_SENT")).toBeInTheDocument();
			expect(screen.getByTestId("PProfilePublic_CancelFriendRequest")).toBeInTheDocument();
		});

		it("shows incoming request actions when relation is incoming", async () => {
			renderRelation([createUser("incoming")]);

			expect(await screen.findByTestId("PProfilePublic_AcceptFriend")).toBeInTheDocument();
			expect(screen.getByTestId("PProfilePublic_RefuseFriend")).toBeInTheDocument();
			expect(screen.queryByText("PROFILE_SOCIAL_REQUEST_RECEIVED")).not.toBeInTheDocument();
		});

		it("shows relation load errors", async () => {
			mocks.searchFriends.mockRejectedValueOnce(genericRelationError);

			render(<PProfilePublicRelation profile={profile} />);

			expect(await screen.findByTestId("PProfilePublic_SocialError")).toHaveTextContent(
				"BROKEN_RELATION",
			);
			expect(screen.getByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
		});

		it("keeps add friend disabled when the profile has no target uid", async () => {
			renderRelation([], { uid: undefined });

			const addButton = await screen.findByTestId("PProfilePublic_AddFriend");
			expect(addButton).toBeDisabled();

			expect(mocks.sendFriendRequest).not.toHaveBeenCalled();
		});

		it("does not fetch relation when auth status is not authed", () => {
			mocks.authStatus = "guest";

			render(<PProfilePublicRelation profile={profile} />);

			expect(mocks.searchFriends).not.toHaveBeenCalled();
			expect(screen.getByText("PROFILE_SOCIAL_LOADING")).toBeInTheDocument();
		});
	});

	describe("normal actions", () => {
		it("sends a friend request and shows outgoing state", async () => {
			renderRelation();
			mocks.sendFriendRequest.mockResolvedValueOnce({});

			await userEvent.click(await screen.findByTestId("PProfilePublic_AddFriend"));

			await waitFor(() => expect(mocks.sendFriendRequest).toHaveBeenCalledTimes(1));
			expect(mocks.sendFriendRequest).toHaveBeenCalledWith(
				expect.objectContaining({ uid: "target-uid", username: "target" }),
			);
			expect(await screen.findByText("PROFILE_SOCIAL_REQUEST_SENT")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("accepts an incoming request and shows friend state", async () => {
			renderRelation([createUser("incoming")]);
			mocks.respondFriendRequest.mockResolvedValueOnce({});

			await userEvent.click(await screen.findByTestId("PProfilePublic_AcceptFriend"));

			await waitFor(() => expect(mocks.respondFriendRequest).toHaveBeenCalledTimes(1));
			expect(mocks.respondFriendRequest).toHaveBeenCalledWith(
				expect.objectContaining({ uid: "target-uid", username: "target" }),
				"accept",
			);
			expect(await screen.findByText("PROFILE_SOCIAL_FRIEND")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("refuses an incoming request and returns to add friend", async () => {
			renderRelation([createUser("incoming")]);
			mocks.respondFriendRequest.mockResolvedValueOnce({});

			await userEvent.click(await screen.findByTestId("PProfilePublic_RefuseFriend"));

			await waitFor(() => expect(mocks.respondFriendRequest).toHaveBeenCalledTimes(1));
			expect(mocks.respondFriendRequest).toHaveBeenCalledWith(
				expect.objectContaining({ uid: "target-uid", username: "target" }),
				"refuse",
			);
			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("opens and dismisses the cancel request confirmation without calling backend", async () => {
			renderRelation([createUser("outgoing")]);

			await userEvent.click(await screen.findByTestId("PProfilePublic_CancelFriendRequest"));
			expect(screen.getByRole("dialog")).toBeInTheDocument();

			await clickConfirmDialogButton("PROFILE_SOCIAL_CANCEL_REQUEST_CANCEL");

			await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
			expect(mocks.removeFriend).not.toHaveBeenCalled();
			expect(screen.getByText("PROFILE_SOCIAL_REQUEST_SENT")).toBeInTheDocument();
		});

		it("cancels an outgoing request after confirmation", async () => {
			renderRelation([createUser("outgoing")]);
			mocks.removeFriend.mockResolvedValueOnce({});

			await userEvent.click(await screen.findByTestId("PProfilePublic_CancelFriendRequest"));
			await clickConfirmDialogButton("PROFILE_SOCIAL_CANCEL_REQUEST");

			await waitFor(() => expect(mocks.removeFriend).toHaveBeenCalledTimes(1));
			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("opens and dismisses the remove friend confirmation without calling backend", async () => {
			renderRelation([createUser("friends")]);

			await userEvent.click(await screen.findByTestId("PProfilePublic_RemoveFriend"));
			expect(screen.getByRole("dialog")).toBeInTheDocument();

			await clickConfirmDialogButton("PROFILE_SOCIAL_REMOVE_FRIEND_CANCEL");

			await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
			expect(mocks.removeFriend).not.toHaveBeenCalled();
			expect(screen.getByText("PROFILE_SOCIAL_FRIEND")).toBeInTheDocument();
		});

		it("removes a friend after confirmation", async () => {
			renderRelation([createUser("friends")]);
			mocks.removeFriend.mockResolvedValueOnce({});

			await userEvent.click(await screen.findByTestId("PProfilePublic_RemoveFriend"));
			await clickConfirmDialogButton("PROFILE_SOCIAL_REMOVE_FRIEND");

			await waitFor(() => expect(mocks.removeFriend).toHaveBeenCalledTimes(1));
			expect(mocks.removeFriend).toHaveBeenCalledWith(
				expect.objectContaining({ uid: "target-uid", username: "target" }),
			);
			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expectNoSocialError();
		});
	});

	describe("stale state races", () => {
		it("treats a missing outgoing request during cancel as an already completed cancellation", async () => {
			renderRelation([createUser("outgoing")]);
			mocks.removeFriend.mockRejectedValueOnce(friendshipNotFoundArrayError);

			await userEvent.click(await screen.findByTestId("PProfilePublic_CancelFriendRequest"));
			await clickConfirmDialogButton("PROFILE_SOCIAL_CANCEL_REQUEST");

			await waitFor(() => expect(mocks.removeFriend).toHaveBeenCalledTimes(1));
			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("treats a missing friend during remove as an already completed removal", async () => {
			renderRelation([createUser("friends")]);
			mocks.removeFriend.mockRejectedValueOnce(friendshipNotFoundStringError);

			await userEvent.click(await screen.findByTestId("PProfilePublic_RemoveFriend"));
			await clickConfirmDialogButton("PROFILE_SOCIAL_REMOVE_FRIEND");

			await waitFor(() => expect(mocks.removeFriend).toHaveBeenCalledTimes(1));
			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("shows an expired request message when accepting a missing incoming request", async () => {
			renderRelation([createUser("incoming")]);
			mocks.respondFriendRequest.mockRejectedValueOnce(friendshipNotFoundArrayError);

			await userEvent.click(await screen.findByTestId("PProfilePublic_AcceptFriend"));

			await waitFor(() => expect(mocks.respondFriendRequest).toHaveBeenCalledTimes(1));
			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expect(screen.getByTestId("PProfilePublic_SocialError")).toHaveTextContent(
				"PROFILE_SOCIAL_REQUEST_EXPIRED",
			);
		});

		it("silently ignores a missing incoming request during refuse", async () => {
			renderRelation([createUser("incoming")]);
			mocks.respondFriendRequest.mockRejectedValueOnce(friendshipNotFoundStringError);

			await userEvent.click(await screen.findByTestId("PProfilePublic_RefuseFriend"));

			await waitFor(() => expect(mocks.respondFriendRequest).toHaveBeenCalledTimes(1));
			expect(await screen.findByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("accepts an incoming request when sending finds an existing pending friendship", async () => {
			mocks.searchFriends
				.mockResolvedValueOnce({
					users: [],
				})
				.mockResolvedValueOnce({
					users: [createUser("incoming")],
				});
			mocks.sendFriendRequest.mockRejectedValueOnce(friendshipAlreadyExistsError);
			mocks.respondFriendRequest.mockResolvedValueOnce({});

			render(<PProfilePublicRelation profile={profile} />);

			await userEvent.click(await screen.findByTestId("PProfilePublic_AddFriend"));

			await waitFor(() => expect(mocks.sendFriendRequest).toHaveBeenCalledTimes(1));
			expect(mocks.respondFriendRequest).toHaveBeenCalledWith(
				expect.objectContaining({ uid: "target-uid", username: "target" }),
				"accept",
			);
			expect(await screen.findByText("PROFILE_SOCIAL_FRIEND")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("syncs to outgoing when send finds an already existing outgoing request", async () => {
			mocks.searchFriends
				.mockResolvedValueOnce({ users: [] })
				.mockResolvedValueOnce({ users: [createUser("outgoing")] });
			mocks.sendFriendRequest.mockRejectedValueOnce(friendshipAlreadyExistsError);

			render(<PProfilePublicRelation profile={profile} />);

			await userEvent.click(await screen.findByTestId("PProfilePublic_AddFriend"));

			await waitFor(() => expect(mocks.searchFriends).toHaveBeenCalledTimes(2));
			expect(mocks.respondFriendRequest).not.toHaveBeenCalled();
			expect(await screen.findByText("PROFILE_SOCIAL_REQUEST_SENT")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("syncs to friend when send finds an already accepted friendship", async () => {
			mocks.searchFriends
				.mockResolvedValueOnce({ users: [] })
				.mockResolvedValueOnce({ users: [createUser("friends")] });
			mocks.sendFriendRequest.mockRejectedValueOnce(friendshipAlreadyExistsError);

			render(<PProfilePublicRelation profile={profile} />);

			await userEvent.click(await screen.findByTestId("PProfilePublic_AddFriend"));

			await waitFor(() => expect(mocks.searchFriends).toHaveBeenCalledTimes(2));
			expect(mocks.respondFriendRequest).not.toHaveBeenCalled();
			expect(await screen.findByText("PROFILE_SOCIAL_FRIEND")).toBeInTheDocument();
			expectNoSocialError();
		});

		it("falls back to friend when backend says friendship exists but re-sync returns no exact match", async () => {
			mocks.searchFriends.mockResolvedValueOnce({ users: [] }).mockResolvedValueOnce({
				users: [createUser("outgoing", { uid: "other-uid", username: "other" })],
			});
			mocks.sendFriendRequest.mockRejectedValueOnce(friendshipAlreadyExistsError);

			render(<PProfilePublicRelation profile={profile} />);

			await userEvent.click(await screen.findByTestId("PProfilePublic_AddFriend"));

			await waitFor(() => expect(mocks.searchFriends).toHaveBeenCalledTimes(2));
			expect(await screen.findByText("PROFILE_SOCIAL_FRIEND")).toBeInTheDocument();
			expectNoSocialError();
		});
	});

	describe("error reporting", () => {
		it("shows send errors that are not already-exists races", async () => {
			renderRelation();
			mocks.sendFriendRequest.mockRejectedValueOnce(genericActionError);

			await userEvent.click(await screen.findByTestId("PProfilePublic_AddFriend"));

			expect(await screen.findByTestId("PProfilePublic_SocialError")).toHaveTextContent(
				"BROKEN_ACTION",
			);
			expect(screen.getByTestId("PProfilePublic_AddFriend")).toBeInTheDocument();
		});

		it("shows accept errors that are not missing-friend races", async () => {
			renderRelation([createUser("incoming")]);
			mocks.respondFriendRequest.mockRejectedValueOnce(genericActionError);

			await userEvent.click(await screen.findByTestId("PProfilePublic_AcceptFriend"));

			expect(await screen.findByTestId("PProfilePublic_SocialError")).toHaveTextContent(
				"BROKEN_ACTION",
			);
			expect(screen.getByTestId("PProfilePublic_AcceptFriend")).toBeInTheDocument();
			expect(screen.getByTestId("PProfilePublic_RefuseFriend")).toBeInTheDocument();
			expect(screen.queryByText("PROFILE_SOCIAL_REQUEST_RECEIVED")).not.toBeInTheDocument();
		});

		it("shows remove errors that are not missing-friend races", async () => {
			renderRelation([createUser("friends")]);
			mocks.removeFriend.mockRejectedValueOnce(genericActionError);

			await userEvent.click(await screen.findByTestId("PProfilePublic_RemoveFriend"));
			await clickConfirmDialogButton("PROFILE_SOCIAL_REMOVE_FRIEND");

			expect(await screen.findByTestId("PProfilePublic_SocialError")).toHaveTextContent(
				"BROKEN_ACTION",
			);
			expect(screen.getByText("PROFILE_SOCIAL_FRIEND")).toBeInTheDocument();
		});
	});
});
