export type TFriendStatus = "offline" | "busy" | "online";

export interface IFriendInfo {
	picture?: Blob;
	name: string;
	status: TFriendStatus;
}
