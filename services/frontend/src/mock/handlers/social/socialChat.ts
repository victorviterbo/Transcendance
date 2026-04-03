import { http, HttpResponse } from "msw";
import { API_SOCIAL_FRIENDS_MESSAGE_FEED } from "../../../constants";
import type { IFriendMessageReq } from "../../../types/friends";
import { mockGetMessageDB, type IMockMessageDBUser } from "./socialChat_dbs";

//--------------------------------------------------
//                  STD PROTOCOLES
//--------------------------------------------------
export const friendMessageHandler = http.post(
	API_SOCIAL_FRIENDS_MESSAGE_FEED,
	async ({ request }) => {
		const isError: boolean = false;
		const data: IFriendMessageReq = (await request.json()) as IFriendMessageReq;

		const friendFeed: IMockMessageDBUser | undefined = mockGetMessageDB().data.find(
			(user: IMockMessageDBUser) => {
				return user.friend.uid == data.uid;
			},
		);

		if (!friendFeed || isError)
			return HttpResponse.json(
				{
					error: {
						"not-found": [
							{
								message: "Missing friend named: '" + friendFeed?.friend + "'",
								code: "MISSING_FRIEND",
							},
						],
					},
				},
				{ status: isError ? 404 : 200 },
			);
		return HttpResponse.json(friendFeed.messages);
	},
);
