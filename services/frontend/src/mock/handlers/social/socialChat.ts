import { http, HttpResponse } from "msw";
import { API_SOCIAL_FRIENDS_MESSAGE_FEED } from "../../../constants";
import type { IFriendFeed, IFriendMessage, IFriendMessageReq } from "../../../types/friends";
import { mockGetMessageDB, type IMockMessageDBUser } from "./socialChat_dbs";
import { mockSocialDB } from "./social_dbs";
import type { TWSRcv } from "../../../types/websocket";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

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

//--------------------------------------------------
//
//--------------------------------------------------
export function mockMessagesFriend1Update(client: WebSocketClientConnectionProtocol) {
	const targetFeed: IFriendFeed | undefined = mockGetMessageDB().data.find(
		(user: IMockMessageDBUser) => {
			return user.friend.uid == mockSocialDB.friends[1].uid;
		},
	)?.messages;

	if (!targetFeed) return;

	setTimeout(() => {
		targetFeed.feed.forEach((message: IFriendMessage) => {
			if (message.direction == "outgoing" && message.status == "not-sent") {
				message.status = "sent";
				const sendbackList: TWSRcv = {
					target: "friend-chat",
					event: "update_status",
					message: message,
				};
				client.send(JSON.stringify(sendbackList));
			}
		});

		setTimeout(() => {
			targetFeed.feed.forEach((message: IFriendMessage) => {
				if (message.direction == "outgoing" && message.status == "sent") {
					message.status = "recieved";
					const sendbackList: TWSRcv = {
						target: "friend-chat",
						event: "update_status",
						message: message,
					};
					client.send(JSON.stringify(sendbackList));
				}
			});

			setTimeout(() => {
				targetFeed.feed.forEach((message: IFriendMessage) => {
					if (message.direction == "outgoing" && message.status == "recieved") {
						message.status = "read";
						const sendbackList: TWSRcv = {
							target: "friend-chat",
							event: "update_status",
							message: message,
						};
						client.send(JSON.stringify(sendbackList));
					}
				});

				setTimeout(() => {
					const sendbackList: TWSRcv = {
						target: "friend-chat",
						event: "new",
						message: {
							message: "Yeah that's damm big",
							date: new Date(),
							direction: "incoming",
							"target-id": mockSocialDB.friends[1].uid,
							target: mockSocialDB.friends[1].username,
							uid: crypto.randomUUID(),
						},
					};
					targetFeed.feed.push(sendbackList.message);
					client.send(JSON.stringify(sendbackList));
				}, 2000);
			}, 2000);
		}, 2000);
	}, 5000);
}
