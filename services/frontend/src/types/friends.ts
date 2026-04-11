import type { IErrorStruct } from "./error";
import type { IExtUserInfo } from "./user";

export type TFriendStatus = "offline" | "busy" | "online";
export type TFriendRelation = "not-friends" | "friends" | "incoming" | "outgoing";
export type TMessageStatus = "not-sent" | "sent" | "recieved" | "read";
export type TMessageDirection = "outgoing" | "incoming";

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
export interface IFriendReqRes {
	"target-username": string;
	"target-uid": string;
	"new-status": "accept" | "refuse";
}

export interface IFriendReqResponse {
	description: string;
	"target-username": string;
	"target-uid": string;
	error?: IErrorStruct;
}

//====================== MESSAGES ======================
export interface IFriendMessageReq {
	username: string;
	uid: string;
}

export interface IFriendMessage {
	message: string;
	date: Date | string;
	direction: TMessageDirection;
	status?: TMessageStatus;
	"target-id": string;
	target: string;
	uid: string;
}

export interface IFriendFeed {
	feed: IFriendMessage[];
	error?: IErrorStruct;
}
