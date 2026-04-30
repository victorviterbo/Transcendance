import type { IGameData } from "../../../types/game";

export interface IMockGameData extends IGameData {

}

const mockGameData: Record<string, IMockGameData> = {}

export function mockCreateRoom(RoomID: string) {
	
	const nRoom: IMockGameData = {
		players: [],
		maxPlayers: 100
	}
	mockGameData[RoomID] = nRoom;
	return nRoom;

}

export function mockGetGameData(RoomID: string): IMockGameData {
	if(!mockGameData[RoomID])
		mockCreateRoom(RoomID);
	return mockGameData[RoomID]
}