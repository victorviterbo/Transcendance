import type { IErrorStruct } from "./error";
import type { IGameUser } from "./game";
import type { TFriendRelation } from "./socials";

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


//====================== CONVERTION ======================
export const convGameUserToExtUser = (user: IGameUser, self?: string): IExtUserInfo => {
	return {
		uid: user.uid,
		username: user.username,
		image: user.avatar,

		badges: "",
		relation: self && self == user.uid ? "self" : "not-friends",
	}
}
export const convExtUserToGameUser = (user: IExtUserInfo, guest: boolean): IGameUser => {
	return {
		uid: user.uid,
		username: user.username,
		avatar: user.image,
		guest: guest,
	}
}	