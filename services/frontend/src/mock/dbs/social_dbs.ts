import type { IErrorReturn } from "../../types/error";
import type {
	IFriendInfo,
	IFriendReqRes,
	IFriendReqSend,
	IFriendRequests,
	TFriendStatus,
} from "../../types/friends";
import type { IExtUserInfo, IExtUserList } from "../../types/user";
import { mockProfilesPics } from "../rcs/profilepics";

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
			image: mockProfilesPics[i % mockProfilesPics.length],
			badges: badges[i % badges.length],
			relation: "not-friends",
		});
	}

	const stopValue = mockSocialDB.users.length - nbFriends - 1;
	for (let i = mockSocialDB.users.length - 1; i > stopValue; i--) {
		mockSocialDB.friends.push({
			uid: mockSocialDB.users[i].uid,
			username: mockSocialDB.users[i].username,
			image: mockSocialDB.users[i].image,

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
	if (!data["target-username"])
		return {
			error: {
				"target-username": [
					{ message: "'target-username' is missing", code: "MISSING_FIELD" },
				],
			},
		};

	if (!data["target-uid"])
		return {
			error: {
				"target-uid": [{ message: "'target-uid' is missing", code: "MISSING_FIELD" }],
			},
		};

	const user = mockSocialDB.users.find((user: IExtUserInfo) => {
		return user.uid == data["target-uid"];
	});
	if (!user)
		return {
			error: { notfound: [{ message: "target not found", code: "NOT_FOUND" }] },
			status: 404,
		};
	user.relation = "outgoing";
	return user;
}

export function mockSocialOnResponse(
	data: IFriendReqRes,
): IExtUserInfo | IFriendInfo | IErrorReturn {
	if (!data["target-username"])
		return {
			error: {
				"target-username": [
					{ message: "'target-username' is missing", code: "MISSING_FIELD" },
				],
			},
		};

	if (!data["target-uid"])
		return {
			error: {
				"target-uid": [{ message: "'target-uid' is missing", code: "MISSING_FIELD" }],
			},
		};

	const user = mockSocialDB.users.find((user: IExtUserInfo) => {
		return user.uid == data["target-uid"];
	});
	const userPos: number = mockSocialDB.users.findIndex((user: IExtUserInfo) => {
		return user.uid == data["target-uid"];
	});
	if (!user)
		return {
			error: { notfound: [{ message: "target not found", code: "NOT_FOUND" }] },
			status: 404,
		};

	if (data["new-status"] == "refuse") {
		user.relation = "not-friends";
		return user;
	}
	mockSocialDB.friends.push({
		uid: mockSocialDB.users[userPos].uid,
		username: mockSocialDB.users[userPos].username,
		image: mockSocialDB.users[userPos].image,

		exp_points: Math.round(Math.random() * 1000),
		badges: mockSocialDB.users[userPos].badges,

		created_at: new Date().toLocaleDateString(),
		status: status[Math.floor(Math.random() * status.length)],
	});
	mockSocialDB.users.splice(userPos, 1);
	return mockSocialDB.friends[mockSocialDB.friends.length - 1];
}
