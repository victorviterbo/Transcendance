import type { IErrorReturn } from "../../../types/error";
import type {
	IFriendInfo,
	IFriendRemoveReq,
	IFriendReqRes,
	IFriendReqSend,
	IFriendRequests,
	TFriendStatus,
} from "../../../types/socials";
import type { IExtUserInfo, IExtUserList } from "../../../types/user";
import { mockProfilesPics } from "../../rcs/profilepics";
import { mockGetMessageDB } from "./socialChat_dbs";

//--------------------------------------------------
//                    LOCAL DB
//--------------------------------------------------
export interface mockISocialDB {
	users: IExtUserInfo[];
	friends: IFriendInfo[];
}

export const mockSocialDB: mockISocialDB = {
	users: [],
	friends: [],
};

const socialDBUsernames = [
	"Sarah is the best",
	"Johnny",
	"Marc",
	"Ava",
	"由美子",
	"岡田",
	"WillIAm",
	"Dua_",
	"John74",
	"John99",
	"SdS",
	"nagini",
	"S74",
	"Emma",
	"Liam",
	"Noah",
	"Chloe",
	"Mia_22",
	"Ethan",
	"Lucas",
	"Sophia",
	"Isabella",
	"Mason",
	"Harper",
	"Yuki",
	"Ren",
	"Takashi",
	"Alex87",
	"PixelFox",
	"NightOwl",
	"さくら",
	"たけし",
	"ゆうき",
	"みか",
	"かずま",
	"Akira",
	"Hikari",
	"Kitsune",
	"NekoShadow",
	"Ryu_88",
];

const badges = ["The mask singer", "Pro gesser", "Diva", "DJ", "casual gamer", "Guess master"];
const status: TFriendStatus[] = ["busy", "online", "offline"];
const nbFriends = 5;
const nbSent = 3;
const nbRecieved = 4;

export function mockSocialSetDB() {
	if (mockSocialDB.users.length > 0) return;
	for (let i = 0; i < socialDBUsernames.length; i++) {
		mockSocialDB.users.push({
			uid: crypto.randomUUID(),
			username: socialDBUsernames[i],
			avatar: mockProfilesPics[i % mockProfilesPics.length],
			badges: badges[i % badges.length],
			relation: "not-friends",
		});
	}

	const stopValue = mockSocialDB.users.length - nbFriends - 1;
	for (let i = mockSocialDB.users.length - 1; i > stopValue; i--) {
		mockSocialDB.friends.push({
			uid: mockSocialDB.users[i].uid,
			username: mockSocialDB.users[i].username,
			avatar: mockSocialDB.users[i].avatar,

			exp_points: Math.round(Math.random() * 1000),
			badges: mockSocialDB.users[i].badges,

			created_at: new Date().toLocaleDateString(),
			status: status[Math.floor(Math.random() * status.length)],
		});
		mockSocialDB.users.pop();
	}

	for (let i = mockSocialDB.users.length - 1; i > mockSocialDB.users.length - nbSent - 1; i--) {
		mockSocialDB.users[i].relation = "outgoing";
	}

	for (
		let i = mockSocialDB.users.length - nbSent - 1;
		i > mockSocialDB.users.length - nbSent - nbRecieved - 1;
		i--
	) {
		mockSocialDB.users[i].relation = "incoming";
	}
}

export function mockSocialResetDB() {
	mockSocialDB.friends = [];
	mockSocialDB.users = [];
	mockSocialSetDB();
}

//====================== GETTERS ======================
export function mockGetExtUser(index: number): IExtUserInfo {
	mockSocialSetDB();
	return mockSocialDB.users[index];
}
export function mockGetExtUsers(searchFilter: string): IExtUserList {
	mockSocialSetDB();
	const list: IExtUserList = { users: [] };
	mockSocialDB.users.forEach((info: IExtUserInfo) => {
		if (
			searchFilter !== "" &&
			!info.username.toLocaleLowerCase().includes(searchFilter.toLocaleLowerCase())
		)
			return;

		list.users.push(info);
	});

	mockSocialDB.friends.forEach((info: IFriendInfo) => {
		if (
			searchFilter !== "" &&
			!info.username.toLocaleLowerCase().includes(searchFilter.toLocaleLowerCase())
		)
			return;
		const asExt = { relation: "friends", ...info } as IExtUserInfo;
		list.users.push(asExt);
	});

	return list;
}

export function mockGetRequests(): IFriendRequests {
	const data: IFriendRequests = {
		incoming: [],
		outgoing: [],
	};

	mockSocialDB.users.forEach((value: IExtUserInfo) => {
		if (value.relation == "incoming") data.incoming.push(value);
		else if (value.relation == "outgoing") data.outgoing.push(value);
	});

	return data;
}

export function mockGetMaxUsers(): number {
	mockSocialSetDB();
	return mockSocialDB.users.length;
}

//====================== MANAGE ======================
export function mockOnAddRequestSend(data: IFriendReqSend): IExtUserInfo | IErrorReturn {
	if (!data.targetUsername)
		return {
			error: {
				targetUsername: [
					{ message: "'target-username' is missing", code: "MISSING_FIELD" },
				],
			},
		};

	if (!data.targetUid)
		return {
			error: {
				targetUid: [{ message: "'target-uid' is missing", code: "MISSING_FIELD" }],
			},
		};

	let user = mockSocialDB.users.find((user: IExtUserInfo) => {
		return user.uid == data.targetUid || user.username == data.targetUsername;
	});
	if (!user) {
		user = {
			uid: data.targetUid,
			username: data.targetUsername,
			avatar: mockProfilesPics[0],
			badges: badges[0],
			relation: "not-friends",
		};
		mockSocialDB.users.push(user);
	}
	user.relation = "outgoing";
	return user;
}

export function mockSocialOnResponse(
	data: IFriendReqRes,
): IExtUserInfo | IFriendInfo | IErrorReturn {
	if (!data.targetUsername)
		return {
			error: {
				targetUsername: [
					{ message: "'target-username' is missing", code: "MISSING_FIELD" },
				],
			},
		};

	if (!data.targetUid)
		return {
			error: {
				targetUid: [{ message: "'target-uid' is missing", code: "MISSING_FIELD" }],
			},
		};

	const user = mockSocialDB.users.find((user: IExtUserInfo) => {
		return user.uid == data.targetUid || user.username == data.targetUsername;
	});
	const userPos: number = mockSocialDB.users.findIndex((user: IExtUserInfo) => {
		return user.uid == data.targetUid || user.username == data.targetUsername;
	});
	if (!user)
		return {
			error: { notfound: [{ message: "target not found", code: "NOT_FOUND" }] },
			status: 404,
		};

	if (data.newStatus == "refuse") {
		user.relation = "not-friends";
		return user;
	}
	mockSocialDB.friends.push({
		uid: mockSocialDB.users[userPos].uid,
		username: mockSocialDB.users[userPos].username,
		avatar: mockSocialDB.users[userPos].avatar,

		exp_points: Math.round(Math.random() * 1000),
		badges: mockSocialDB.users[userPos].badges,

		created_at: new Date().toLocaleDateString(),
		status: status[Math.floor(Math.random() * status.length)],
	});

	mockSocialDB.users.splice(userPos, 1);
	const currentFriend: IFriendInfo = mockSocialDB.friends[mockSocialDB.friends.length - 1];
	mockGetMessageDB().data.push({
		friend: currentFriend,
		messages: {
			feed: [],
		},
	});
	return currentFriend;
}

export function mockOnFriendRemove(
	data: IFriendRemoveReq,
): IFriendInfo | IExtUserInfo | IErrorReturn {
	if (!data.targetUid)
		return {
			error: {
				targetUid: [{ message: "'target-uid' is missing", code: "MISSING_FIELD" }],
			},
		};

	const friendPos = mockSocialDB.friends.findIndex((friend: IFriendInfo) => {
		return friend.uid == data.targetUid || friend.username == data.targetUsername;
	});
	if (friendPos >= 0) {
		const [friend] = mockSocialDB.friends.splice(friendPos, 1);
		mockSocialDB.users.push({
			uid: friend.uid,
			username: friend.username,
			avatar: friend.avatar,
			badges: friend.badges,
			relation: "not-friends",
		});
		return friend;
	}

	const user = mockSocialDB.users.find((user: IExtUserInfo) => {
		return user.uid == data.targetUid || user.username == data.targetUsername;
	});
	if (user?.relation == "outgoing") {
		user.relation = "not-friends";
		return user;
	}

	return {
		error: { friendship: [{ message: "friendship not found", code: "FRIENDSHIP_NOT_FOUND" }] },
		status: 400,
	};
}
