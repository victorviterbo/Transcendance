import type { IErrorStruct } from "./error";
import type { IExtUserInfo } from "./user";

export type TFriendStatus = "offline" | "busy" | "online";
export type TRelationStatus = "idle" | "loading" | "ready" | "error";
export type TRelationAction = "send" | "accept" | "refuse" | "remove" | "cancel";
export type TConfirmableRelationAction = Extract<TRelationAction, "remove" | "cancel">;
export type TFriendRelation = "not-friends" | "friends" | "incoming" | "outgoing" | "self";
export type TMessageStatus = "not-sent" | "sent" | "recieved" | "read" | "error";
export type TMessageDirection = "outgoing" | "incoming";

export interface IFriendsList {
	friends: IFriendInfo[];
	error?: IErrorStruct;
}

export interface IFriendInfo {
	uid: string;
	username: string;
	avatar: string;

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
	targetUsername: string;
	targetUid: string;
}
export interface IFriendReqRes {
	targetUsername: string;
	targetUid: string;
	newStatus: "accept" | "refuse";
}

export interface IFriendRemoveReq {
	targetUsername: string;
	targetUid: string;
}

export interface IFriendReqResponse {
	error?: IErrorStruct;
}

export interface IRelationState {
	status: TRelationStatus;
	relation: TFriendRelation;
	error: string | null;
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
	targetUid: string;
	target: string;
	uid: string;
}

export interface IFriendFeed {
	feed: IFriendMessage[];
	error?: IErrorStruct;
}

//====================== NOTIFICATION ======================
export interface INotifList {
	notifs: TNotif[];
	error?: IErrorStruct;
}

export type TNotif =
	| {
			uid: string;
			kind: "friend_request";
			from: IExtUserInfo;
			date: Date | string;
			read: boolean;
	  }
	| {
			uid: string;
			kind: "friend_accepted";
			from: IFriendInfo;
			date: Date | string;
			read: boolean;
	  };
