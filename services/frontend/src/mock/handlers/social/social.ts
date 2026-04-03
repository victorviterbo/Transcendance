import { http, HttpResponse } from "msw";
import {
	API_SOCIAL_FRIENDS,
	API_SOCIAL_FRIENDS_REQUEST,
	API_SOCIAL_FRIENDS_REQUEST_RESPOND,
	API_SOCIAL_FRIENDS_REQUEST_SEND,
	API_SOCIAL_FRIENDS_SEARCH,
} from "../../../constants";
import type {
	IFriendInfo,
	IFriendReqRes,
	IFriendReqSend,
	IFriendRequests,
} from "../../../types/friends";
import type { IExtUserInfo, IExtUserSearch } from "../../../types/user";
import {
	mockGetExtUsers,
	mockOnAddRequestSend,
	mockSocialOnResponse,
	mockSocialDB,
	mockSocialSetDB,
} from "./social_dbs";
import type { IErrorReturn } from "../../../types/error";

// const friends = ws.link("ws://localhost:5173/");

//--------------------------------------------------
//                   HANDLERS
//--------------------------------------------------
// export const friendConnHandler = friends.addEventListener("connection", () => {
// 	console.log("try to connect....");
// });

export const friendsListHandler = http.get(API_SOCIAL_FRIENDS, async () => {
	mockSocialSetDB();
	const isError = 0;

	if (isError)
		return HttpResponse.json(
			{
				friends: mockSocialDB.friends,
				error: {
					default: [
						{ message: "Friends are disabled", code: "Friends are disabled" },
						{ message: "No friends", code: "FRIEND_ERROR" },
					],
				},
			},
			{ status: isError ? 400 : 200 },
		);
	return HttpResponse.json({ friends: mockSocialDB.friends });
});

export const friendsSearchHandler = http.post(API_SOCIAL_FRIENDS_SEARCH, async ({ request }) => {
	mockSocialSetDB();

	const isError: boolean = false;
	const data: IExtUserSearch = (await request.json()) as IExtUserSearch;

	if (isError)
		return HttpResponse.json(
			{
				friends: mockGetExtUsers(data.search),
				error: {
					default: [
						{ message: "Friends are disabled", code: "Can't look up for friends" },
					],
				},
			},
			{ status: isError ? 400 : 200 },
		);
	return HttpResponse.json(mockGetExtUsers(data.search));
});

export const friendsRequestsHandler = http.get(API_SOCIAL_FRIENDS_REQUEST, async () => {
	mockSocialSetDB();
	const isError: boolean = false;
	const res: IFriendRequests = {
		outgoing: [],
		incoming: [],
	};

	mockSocialDB.users.forEach((value: IExtUserInfo) => {
		if (value.relation == "incoming") res.incoming.push(value);
		if (value.relation == "outgoing") res.outgoing.push(value);
	});

	if (isError) {
		res.error = {
			default: [{ message: "Friends are disabled", code: "Can't look up for friends" }],
		};
	}
	return HttpResponse.json(res, { status: isError ? 400 : 200 });
});

export const friendsRequestsSendHandler = http.post(
	API_SOCIAL_FRIENDS_REQUEST_SEND,
	async ({ request }) => {
		mockSocialSetDB();
		const data: IFriendReqSend = (await request.json()) as IFriendReqSend;
		const out: IExtUserInfo | IErrorReturn = mockOnAddRequestSend(data);
		if ("error" in out)
			return HttpResponse.json(
				{
					error: out.error,
				},
				{ status: out.status ? out.status : 400 },
			);
		const user: IExtUserInfo = out as IExtUserInfo;
		user.relation = "outgoing";
		return HttpResponse.json(
			{
				"target-username": user.username,
				"target-uid": user.uid,
				description: "FRIENDSHIP_REQUEST_SENT",
			},
			{ status: 201 },
		);
	},
);

export const friendsRequestsResponseHandler = http.post(
	API_SOCIAL_FRIENDS_REQUEST_RESPOND,
	async ({ request }) => {
		mockSocialSetDB();
		const data: IFriendReqRes = (await request.json()) as IFriendReqRes;
		const out: IExtUserInfo | IFriendInfo | IErrorReturn = mockSocialOnResponse(data);
		if ("error" in out)
			return HttpResponse.json(
				{
					error: out.error,
				},
				{ status: out.status ? out.status : 400 },
			);

		if ("created_at" in out) {
			const user: IFriendInfo = out as IFriendInfo;
			return HttpResponse.json(
				{
					"target-username": user.username,
					"target-uid": user.uid,
					description: "FRIENDSHIP_REQUEST_ACCEPTED",
				},
				{ status: 201 },
			);
		}
		const user: IExtUserInfo = out as IExtUserInfo;
		return HttpResponse.json(
			{
				"target-username": user.username,
				"target-uid": user.uid,
				description: "FRIENDSHIP_REQUEST_SENT",
			},
			{ status: 201 },
		);
	},
);
