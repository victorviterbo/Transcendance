import { debugLog } from "../../../utils/debug";
import { http, HttpResponse } from "msw";
import { API_SOCIAL_FRIENDS_MESSAGE_FEED } from "../../../constants";
import type {
	IFriendFeed,
	IFriendInfo,
	IFriendMessage,
	IFriendMessageReq,
} from "../../../types/socials";
import { mockGetMessageDB, type IMockMessageDBUser } from "./socialChat_dbs";
import { mockSocialDB } from "./social_dbs";
import type { TWSRcv, TWSSend } from "../../../types/websocket";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";

const BLOCK_SOCIAL_MOCK_EVENT = true;

//--------------------------------------------------
//                     DEBUG VARS
//--------------------------------------------------
export let mockOpenedWith: IFriendInfo | undefined | null = undefined;
export const mockSetOpenedWith = (
	target: IFriendInfo | undefined | null,
	was: IFriendInfo | undefined | null,
) => {
	if (target)
		debugLog(
			"Chat %copened%c with: %c" + target.username + "%c",
			"color: #36a11b",
			"color: #fff",
			"color: #8c91db",
			"color: #fff",
		);
	else if (was)
		debugLog(
			"Chat %cclosed%c with: %c" + was.username + "%c",
			"color: #df9a1c",
			"color: #fff",
			"color: #8c91db",
			"color: #fff",
		);
	mockOpenedWith = target;
};

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

	if (BLOCK_SOCIAL_MOCK_EVENT) return;

	setTimeout(() => {
		targetFeed.feed.forEach((message: IFriendMessage) => {
			if (message.direction == "outgoing" && message.status == "not-sent") {
				message.status = "sent";
				const sendbackList: TWSRcv = {
					target: "friend_chat",
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
						target: "friend_chat",
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
							target: "friend_chat",
							event: "update_status",
							message: message,
						};
						client.send(JSON.stringify(sendbackList));
					}
				});

				setTimeout(() => {
					const sendbackList: TWSRcv = {
						target: "friend_chat",
						event: "new",
						message: {
							message: "Yeah that's damm big",
							date: new Date(),
							direction: "incoming",
							targetUid: mockSocialDB.friends[1].uid,
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

export function onMessageSent(data: TWSSend, client: WebSocketClientConnectionProtocol) {
	if (data.target != "friend_chat") return;
	if (data.event != "send") return;
	if (!data.message) return;

	const messageUser: IMockMessageDBUser | undefined = mockGetMessageDB().data.find(
		(user: IMockMessageDBUser) => {
			if (!data.message) return undefined;
			return user.friend.uid == data.message.targetUid;
		},
	);

	if (!messageUser) return;

	const targetFeed: IFriendFeed = messageUser.messages;

	targetFeed.feed.push(data.message);
	data.message.status = "sent";
	data.message.uid = crypto.randomUUID();

	if (messageUser.friend.username == "Hikari") {
		data.message.status = "error";
		const sendbackList: TWSRcv = {
			target: "friend_chat",
			event: "new",
			message: data.message,
		};
		client.send(JSON.stringify(sendbackList));
		return;
	}

	const sendbackList: TWSRcv = {
		target: "friend_chat",
		event: "new",
		message: data.message,
	};
	client.send(JSON.stringify(sendbackList));

	setTimeout(() => {
		targetFeed.feed.forEach((message: IFriendMessage) => {
			if (
				message.direction == "outgoing" &&
				(message.status == "not-sent" || message.status == "sent")
			) {
				message.status = "recieved";
				const sendbackList: TWSRcv = {
					target: "friend_chat",
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
						target: "friend_chat",
						event: "update_status",
						message: message,
					};
					client.send(JSON.stringify(sendbackList));
				}
			});

			setTimeout(() => {
				const sendbackList: TWSRcv = {
					target: "friend_chat",
					event: "new",
					message: {
						message: "hey, how you doing ?",
						date: new Date(),
						direction: "incoming",
						targetUid: messageUser.friend.uid,
						target: messageUser.friend.username,
						uid: crypto.randomUUID(),
					},
				};
				targetFeed.feed.push(sendbackList.message);
				client.send(JSON.stringify(sendbackList));
			}, 2000);
		}, 1000);
	}, 1000);
}

export function onMessageStatus(data: TWSSend) {
	if (data.target != "friend_chat") return;
	if (data.event != "open" && data.event != "close") return;
	if (!data.toUid) return;

	const friend: IFriendInfo | undefined = mockSocialDB.friends.find((value: IFriendInfo) => {
		if (!data.toUid) return false;
		return value.uid == data.toUid;
	});

	if (!friend) return;

	if (data.event == "open") mockSetOpenedWith(friend, null);
	if (data.event == "close") mockSetOpenedWith(null, friend);
}
