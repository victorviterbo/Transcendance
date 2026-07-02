import { http, HttpResponse } from "msw";
import {
	API_SOCIAL_FRIENDS,
	API_SOCIAL_FRIENDS_REQUEST,
	API_SOCIAL_FRIENDS_REQUEST_RESPOND,
	API_SOCIAL_FRIENDS_REQUEST_SEND,
	API_SOCIAL_FRIENDS_SEARCH,
	API_SOCIAL_FRIEND_REMOVE,
	API_SOCIAL_NOTIFS,
	API_SOCIAL_NOTIFS_READ,
} from "../../../constants";
import type {
	IFriendInfo,
	IFriendRemoveReq,
	IFriendReqRes,
	IFriendReqSend,
	IFriendRequests,
	INotifList,
	TNotif,
} from "../../../types/socials";
import type { IExtUserInfo, IExtUserSearch } from "../../../types/user";
import {
	mockGetExtUsers,
	mockOnFriendRemove,
	mockOnAddRequestSend,
	mockSocialOnResponse,
	mockSocialDB,
	mockSocialSetDB,
} from "./social_dbs";
import type { IErrorReturn, IErrorStruct } from "../../../types/error";
import { WebSocketClientConnectionProtocol } from "@mswjs/interceptors/WebSocket";
import type { TWSRcv } from "../../../types/websocket";
import { mockGetMessageDB } from "./socialChat_dbs";

//--------------------------------------------------
//                   HANDLERS
//--------------------------------------------------
//====================== FIREND ======================
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
				targetUsername: user.username,
				targetUid: user.uid,
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
					targetUsername: user.username,
					targetUid: user.uid,
					description: "FRIENDSHIP_REQUEST_ACCEPTED",
				},
				{ status: 201 },
			);
		}
		const user: IExtUserInfo = out as IExtUserInfo;
		return HttpResponse.json(
			{
				targetUsername: user.username,
				targetUid: user.uid,
				description: "FRIENDSHIP_REQUEST_SENT",
			},
			{ status: 201 },
		);
	},
);

export const friendsRemoveHandler = http.post(API_SOCIAL_FRIEND_REMOVE, async ({ request }) => {
	mockSocialSetDB();
	const data: IFriendRemoveReq = (await request.json()) as IFriendRemoveReq;
	const out: IExtUserInfo | IFriendInfo | IErrorReturn = mockOnFriendRemove(data);
	if (!("uid" in out))
		return HttpResponse.json(
			{
				error: out.error,
			},
			{ status: out.status ? out.status : 400 },
		);

	return HttpResponse.json(
		{
			targetUsername: out.username,
			targetUid: out.uid,
			description:
				"relation" in out && out.relation === "not-friends"
					? "FRIENDSHIP_REQUEST_CANCELLED"
					: "FRIENDSHIP_REMOVED",
		},
		{ status: 200 },
	);
});

//====================== NOTIF ======================
export const notifRequestHandler = http.get(API_SOCIAL_NOTIFS, async () => {
	mockSocialSetDB();

	const isError: boolean = false;
	const res: INotifList = {
		notifs: [],
	};

	let count = 0;
	mockSocialDB.users.forEach((value: IExtUserInfo) => {
		if (value.relation == "incoming") {
			let date: Date = new Date();
			if (count == 1) date = new Date(Date.now() - 1000 * 60 * 5);
			else if (count == 2) date = new Date(Date.now() - 1000 * 60 * 60 * 2);
			else if (count == 3) date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 12);

			res.notifs.push({
				uid: crypto.randomUUID(),
				kind: "friend_request",
				from: value,
				date: date,
				read: count > 1,
			});
			count++;
		}
	});

	if (isError) {
		res.error = {
			default: [{ message: "Notifaction disable", code: "Can't look up for notifications" }],
		};
	}
	return HttpResponse.json(res, { status: isError ? 400 : 200 });
});

export const notifRequestHandlerRead = http.post(API_SOCIAL_NOTIFS_READ, async () => {
	const res: { error?: IErrorStruct } = {};

	const isError: boolean = false;
	if (isError) {
		res.error = {
			default: [{ message: "Notifaction disable", code: "Can't look up for notifications" }],
		};
	}
	return HttpResponse.json(res, { status: isError ? 400 : 200 });
});

export const mockNewIncomingRequests = (client: WebSocketClientConnectionProtocol) => {
	mockSocialSetDB();

	setTimeout(() => {
		const user: IExtUserInfo | undefined = mockSocialDB.users.find((value: IExtUserInfo) => {
			return value.username == "Isabella";
		});
		if (!user) return;
		user.relation = "incoming";
		const notif: TNotif = {
			uid: crypto.randomUUID(),
			kind: "friend_request",
			from: user,
			date: new Date(),
			read: false,
		};

		client.send(
			JSON.stringify({
				target: "notif",
				event: "new",
				notif: notif,
			} as TWSRcv),
		);

		client.send(
			JSON.stringify({
				target: "friend_request",
				event: "new_incoming",
				user: user,
			} as TWSRcv),
		);
	}, 5000);
};

export const mockAcceptingRequests = (client: WebSocketClientConnectionProtocol) => {
	mockSocialSetDB();

	setTimeout(() => {
		const user: IExtUserInfo | undefined = mockSocialDB.users.find((value: IExtUserInfo) => {
			return value.username === "かずま";
		});
		if (!user) return;
		user.relation = "friends";

		const userPos: number = mockSocialDB.users.findIndex((value: IExtUserInfo) => {
			return value.username === "かずま";
		});
		if (!user || userPos == -1) return;

		mockSocialDB.friends.push({
			uid: mockSocialDB.users[userPos].uid,
			username: mockSocialDB.users[userPos].username,
			avatar: mockSocialDB.users[userPos].avatar,

			exp_points: Math.round(Math.random() * 1000),
			badges: mockSocialDB.users[userPos].badges,

			created_at: new Date().toLocaleDateString(),
			status: "online",
		});

		mockSocialDB.users.splice(userPos, 1);
		const currentFriend: IFriendInfo = mockSocialDB.friends[mockSocialDB.friends.length - 1];
		mockGetMessageDB().data.push({
			friend: currentFriend,
			messages: {
				feed: [],
			},
		});

		const notif: TNotif = {
			uid: crypto.randomUUID(),
			kind: "friend_accepted",
			from: currentFriend,
			date: new Date(),
			read: false,
		};

		client.send(
			JSON.stringify({
				target: "notif",
				event: "new",
				notif: notif,
			} as TWSRcv),
		);
	}, 3500);
};
