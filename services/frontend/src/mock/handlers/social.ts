import { http, HttpResponse } from "msw";
import {
	API_SOCIAL_FRIENDS,
	API_SOCIAL_FRIENDS_REQUEST,
	API_SOCIAL_FRIENDS_REQUEST_SEND,
	API_SOCIAL_FRIENDS_SEARCH,
} from "../../constants";
import type {
	IFriendInfo,
	IFriendReqSend,
	IFriendRequests,
	TFriendStatus,
} from "../../types/friends";
import { mockProfilesPics } from "../rcs/profilepics";
import type { IExtUserInfo, IExtUserSearch } from "../../types/user";
import {
	mockGetExtUsers,
	mockOnAddRequestSend,
	mockSocialDB,
	mockSocialSetDB,
} from "../dbs/social_dbs";
import type { IErrorReturn } from "../../types/error";

// const friends = ws.link("ws://localhost:5173/");

//--------------------------------------------------
//                    HELPERS
//--------------------------------------------------
export function mockGenerateFriend(): IFriendInfo {
	const usernames = [
		"Sarah",
		"John",
		"Marc",
		"Ava",
		"由美子",
		"岡田",
		"WillIAm",
		"Dua_",
		"John74",
		"John99",
		"SdS",
	];
	const badges = ["The mask singer", "Pro gesser", "Diva", "DJ", "casual gamer", "Guess master"];

	return {
		uid: "00000",
		username: usernames[Math.floor(Math.random() * usernames.length)],
		image: mockProfilesPics[Math.floor(Math.random() * mockProfilesPics.length)],

		exp_points: Math.floor(Math.random() * 20000),
		badges: badges[Math.floor(Math.random() * badges.length)],

		status: ["online", "busy", "offline"][Math.floor(Math.random() * 3)] as TFriendStatus,
		created_at: new Date().toString(),
	};
}

//--------------------------------------------------
//                   HANDLERS
//--------------------------------------------------
// export const friendConnHandler = friends.addEventListener("connection", () => {
// 	console.log("try to connect....");
// });

export const friendsListHandler = http.get(API_SOCIAL_FRIENDS, async () => {
	const isError = 0;
	const list: IFriendInfo[] = [];

	const max = Math.floor(Math.random() * 10);
	for (let i = 0; i < max; i++) list.push(mockGenerateFriend());
	if (isError)
		return HttpResponse.json(
			{
				friends: list,
				error: {
					default: [
						{ message: "Friends are disabled", code: "Friends are disabled" },
						{ message: "No friends", code: "FRIEND_ERROR" },
					],
				},
			},
			{ status: isError ? 400 : 200 },
		);
	return HttpResponse.json({ friends: list });
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

	mockSocialDB.forEach((value: IExtUserInfo) => {
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
