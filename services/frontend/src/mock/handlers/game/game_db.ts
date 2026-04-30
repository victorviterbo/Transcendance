import type { IGameData } from "../../../types/game";
import { mockSocialDB, mockSocialSetDB } from "../social/social_dbs";

export interface IMockGameData extends IGameData {

}

const mockGameData: Record<string, IMockGameData> = {}

export function mockCreateRoom(RoomID: string) {
	
	mockSocialSetDB();

	const nRoom: IMockGameData = {
		players: [],
		maxPlayers: 100
	}

	//Adding already presents players
	for(let i = 0; i < 4; i++)
	{
		nRoom.players.push({
			points: 0,
			user: mockSocialDB.users[i],
		})
	}


	mockGameData[RoomID] = nRoom;
	return nRoom;

}

export function mockGetGameData(RoomID: string): IMockGameData {
	if(!mockGameData[RoomID])
		mockCreateRoom(RoomID);
	return mockGameData[RoomID]
}