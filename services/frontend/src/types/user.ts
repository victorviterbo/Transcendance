import type { IErrorStruct } from "./error";
import type { TFriendRelation } from "./friends";

export interface IAuthUser {
	username: string;
	id?: number;
	email?: string;
}

export type TAuthStatus = "loading" | "authed" | "guest";

export interface IExtUserSearch {
	search: string;
}

export interface IExtUserList {
	users: IExtUserInfo[];
	error?: IErrorStruct;
}

export interface IExtUserInfo {
	uid: string;
	username: string;
	image: string;

	badges: string;
	relation: TFriendRelation;
}
