export type TFriendStatus = "offline" | "busy" | "online";

export interface IFriendsList {
	friends: IFriendInfo[];
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
