import type { IErrorReturn } from "../../types/error";
import type { IFriendReqSend, IFriendRequests } from "../../types/friends";
import type { IExtUserInfo, IExtUserList } from "../../types/user";
import { mockProfilesPics } from "../rcs/profilepics";

//--------------------------------------------------
//                    LOCAL DB
//--------------------------------------------------
export let mockSocialDB: IExtUserInfo[] = [];

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
];

const badges = ["The mask singer", "Pro gesser", "Diva", "DJ", "casual gamer", "Guess master"];

export function mockSocialSetDB() {
	if (mockSocialDB.length > 0) return;
	for (let i = 0; i < socialDBUsernames.length; i++) {
		mockSocialDB.push({
			uid: crypto.randomUUID(),
			username: socialDBUsernames[i],
			image: mockProfilesPics[i % mockProfilesPics.length],
			badges: badges[i % badges.length],
			relation: i == 0 || i == 2 ? "incoming" : i == 1 ? "outgoing" : "not-friends",
		});
	}
}

export function mockSocialResetDB() {
	mockSocialDB = [];
	mockSocialSetDB();
}

//====================== GETTERS ======================
export function mockGetExtUser(index: number): IExtUserInfo {
	mockSocialSetDB();
	return mockSocialDB[index];
}
export function mockGetExtUsers(searchFilter: string): IExtUserList {
	mockSocialSetDB();
	const list: IExtUserList = { users: [] };
	mockSocialDB.forEach((info: IExtUserInfo) => {
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

	mockSocialDB.forEach((value: IExtUserInfo) => {
		if (value.relation == "incoming") data.incoming.push(value);
		else if (value.relation == "outgoing") data.outgoing.push(value);
	});

	return data;
}

export function mockGetMaxUsers(): number {
	mockSocialSetDB();
	return mockSocialDB.length;
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

	const user = mockSocialDB.find((user: IExtUserInfo) => {
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
