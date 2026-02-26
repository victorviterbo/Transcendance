import { http, HttpResponse } from "msw";
import { API_PRIVATE_ROOMS, API_PUBLIC_ROOMS } from "../../constants";
import type { IRoomInfo } from "../../types/room";

/**
 * @brief Handle mock refresh.
 * @returns New access token if a mock session exists, 401 otherwise.
 */
export const FetchPublicRoom = http.get(API_PUBLIC_ROOMS, async () => {
	const tempRooms: IRoomInfo[] = [];

	for (let i = 0; i < 20; i++) {
		tempRooms.push({
			name: "Test Name",
			theme: "Test theme",
			playerCount: 20,
			playerMax: 100,
		});
	}

	return HttpResponse.json({ rooms: tempRooms });
});

export const FetchPrivateRoom = http.get(API_PRIVATE_ROOMS, async () => {
	const tempRooms: IRoomInfo[] = [];

	for (let i = 0; i < 10; i++) {
		tempRooms.push({
			name: "Test Name",
			theme: "Test theme",
			playerCount: 45,
			playerMax: 100,
		});
	}

	return HttpResponse.json({ rooms: tempRooms });
});
