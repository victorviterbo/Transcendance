import { http, HttpResponse } from "msw";
import {
	API_SOCIAL_FRIENDS,
	API_SOCIAL_FRIENDS_REQUEST,
	API_SOCIAL_FRIENDS_SEARCH,
} from "../../constants";
import type {
	IFriendInfo,
	IFriendRequests,
	TFriendRelation,
	TFriendStatus,
} from "../../types/friends";
import { mockProfilesPics } from "../rcs/profilepics";
import type { IExtUserInfo, IExtUserList, IExtUserSearch } from "../../types/user";

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

export function mockGetExtUser(index: number): IExtUserInfo {
	const userList: IExtUserList = mockGetExtUsers("");
	return userList.users[index];
}
export function mockGetExtUsers(searchFilter: string): IExtUserList {
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
	const relation: TFriendRelation[] = ["not-friends", "incoming", "outgoing"];

	const list: IExtUserList = { users: [] };
	usernames.forEach((name: string, index: number) => {
		if (
			searchFilter !== "" &&
			!name.toLocaleLowerCase().includes(searchFilter.toLocaleLowerCase())
		)
			return;

		list.users.push({
			uid: "00000",
			username: name,
			image: mockProfilesPics[index % mockProfilesPics.length],
			badges: badges[index % badges.length],
			relation: relation[index % relation.length],
		});
	});

	return list;
}
export function mockGetMaxUsers(): number {
	return 11;
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
	const isError: boolean = false;

	const res: IFriendRequests = {
		outgoing: [],
		incoming: [],
	};

	const displayed = Math.floor(Math.random() * 7);

	for (let i = 0; i < displayed; i++) {
		if (Math.round(Math.random())) {
			res.outgoing.push(mockGetExtUser(i % mockGetMaxUsers()));
			res.outgoing[res.outgoing.length - 1].relation = "outgoing";
		} else {
			res.incoming.push(mockGetExtUser(i % mockGetMaxUsers()));
			res.incoming[res.incoming.length - 1].relation = "incoming";
		}
	}

	if (isError) {
		res.error = {
			default: [{ message: "Friends are disabled", code: "Can't look up for friends" }],
		};
	}
	return HttpResponse.json(res, { status: isError ? 400 : 200 });
});
