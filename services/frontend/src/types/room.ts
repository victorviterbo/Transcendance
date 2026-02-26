export interface IRoomList {
	rooms: IRoomInfo[];
}

export interface IRoomInfo {
	name: string;
	theme: string;
	playerCount: number;
	playerMax: number;
}
