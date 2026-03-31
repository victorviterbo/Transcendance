import type { IErrorStruct } from "./error";
import type { IExtUserInfo } from "./user";

export type TFriendStatus = "offline" | "busy" | "online";
export type TFriendRelation = "not-friends" | "friends" | "incoming" | "outgoing";

export interface IFriendsList {
	friends: IFriendInfo[];
	error?: IErrorStruct;
}

export interface IFriendInfo {
	uid: string;
	username: string;
	image: string;

	exp_points: number;
	badges: string;

	created_at: string;
	status: TFriendStatus;
}

export interface IFriendRequests {
	incoming: IExtUserInfo[];
	outgoing: IExtUserInfo[];
	error?: IErrorStruct;
}

export interface IFriendReqSend {
	"target-username": string;
	"target-uid": string;
}

export interface IFriendReqSendResponse {
	description: string;
	"target-username": string;
	"target-uid": string;
	error?: IErrorStruct;
}
