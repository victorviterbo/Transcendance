import api from "./client";
import {
	API_SOCIAL_FRIENDS,
	API_SOCIAL_FRIENDS_MESSAGE_FEED,
	API_SOCIAL_FRIENDS_REQUEST,
	API_SOCIAL_FRIENDS_REQUEST_RESPOND,
	API_SOCIAL_FRIENDS_REQUEST_SEND,
	API_SOCIAL_FRIENDS_SEARCH,
	API_SOCIAL_FRIEND_REMOVE,
	API_SOCIAL_NOTIFS,
	API_SOCIAL_NOTIFS_READ,
} from "../constants";
import type { IErrorStruct } from "../types/error";
import type {
	IFriendFeed,
	IFriendMessageReq,
	IFriendRemoveReq,
	IFriendReqRes,
	IFriendReqResponse,
	IFriendReqSend,
	IFriendRequests,
	IFriendsList,
	INotifList,
} from "../types/socials";
import type { IExtUserList } from "../types/user";

export interface SocialTarget {
	uid: string;
	username: string;
}

type SocialResponseWithError = {
	error?: IErrorStruct;
};

const throwOnSocialError = <TData extends SocialResponseWithError>(data: TData): TData => {
	if (data.error) throw data.error;
	return data;
};

export const fetchFriends = async (): Promise<IFriendsList> => {
	const response = await api.get<IFriendsList>(API_SOCIAL_FRIENDS);
	return throwOnSocialError(response.data);
};

export const searchFriends = async (search: string): Promise<IExtUserList> => {
	const response = await api.post<IExtUserList>(API_SOCIAL_FRIENDS_SEARCH, { search });
	return throwOnSocialError(response.data);
};

export const fetchFriendRequests = async (): Promise<IFriendRequests> => {
	const response = await api.get<IFriendRequests>(API_SOCIAL_FRIENDS_REQUEST);
	return throwOnSocialError(response.data);
};

export const sendFriendRequest = async (
	target: SocialTarget,
): Promise<IFriendReqResponse> => {
	const response = await api.post<IFriendReqResponse>(API_SOCIAL_FRIENDS_REQUEST_SEND, {
		"target-uid": target.uid,
		"target-username": target.username,
	} as IFriendReqSend);
	return throwOnSocialError(response.data);
};

export const respondFriendRequest = async (
	target: SocialTarget,
	newStatus: IFriendReqRes["new-status"],
): Promise<IFriendReqResponse> => {
	const response = await api.post<IFriendReqResponse>(API_SOCIAL_FRIENDS_REQUEST_RESPOND, {
		"target-uid": target.uid,
		"target-username": target.username,
		"new-status": newStatus,
	} as IFriendReqRes);
	return throwOnSocialError(response.data);
};

export const removeFriend = async (target: SocialTarget): Promise<IFriendReqResponse> => {
	const response = await api.post<IFriendReqResponse>(API_SOCIAL_FRIEND_REMOVE, {
		"target-uid": target.uid,
		"target-username": target.username,
	} as IFriendRemoveReq);
	return throwOnSocialError(response.data);
};

export const fetchFriendMessages = async (target: SocialTarget): Promise<IFriendFeed> => {
	const response = await api.post<IFriendFeed>(API_SOCIAL_FRIENDS_MESSAGE_FEED, {
		username: target.username,
		uid: target.uid,
	} as IFriendMessageReq);
	return throwOnSocialError(response.data);
};

export const fetchNotifications = async (): Promise<INotifList> => {
	const response = await api.get<INotifList>(API_SOCIAL_NOTIFS);
	return throwOnSocialError(response.data);
};

export const markNotificationsRead = async (): Promise<void> => {
	const response = await api.post<SocialResponseWithError>(API_SOCIAL_NOTIFS_READ);
	throwOnSocialError(response.data);
};
