import { http, HttpResponse, ws } from "msw";
import { API_SOCIAL_FRIENDS } from "../../constants";
import type { IFriendInfo, TFriendStatus } from "../../types/friends";
import { mockProfilesPics } from "../rcs/profilepics";

const friends = ws.link("ws://localhost:5173/");

//--------------------------------------------------
//                    HELPERS
//--------------------------------------------------
export function mockGenerateFriend(): IFriendInfo {
	const usernames = ["Sarah", "John", "Marc", "Ava", "由美子", "岡田"];
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
export const friendConnHandler = friends.addEventListener("connection", () => {
	console.log("try to connect....");
});

export const friendsListHandler = http.get(API_SOCIAL_FRIENDS, async () => {
	const isError = 1;
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
