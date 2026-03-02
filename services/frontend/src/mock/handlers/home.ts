import { http, HttpResponse } from "msw";
import { API_PRIVATE_ROOMS, API_PUBLIC_ROOMS } from "../../constants";
import type { IRoomInfo } from "../../types/room";

function GenerateRoom(): IRoomInfo {
	const roomNames = [
		"Sarah's room",
		"Carl's room",
		"80's room",
		"Today challenge",
		"Today playlist",
		"Public room %d",
	];

	const themeNames = [
		"Rap",
		"60's",
		"70's",
		"80's",
		"90's",
		"2000",
		"Movies",
		"Pop",
		"Video Game",
		"Country",
		"French",
		"Spanish",
		"JPOP",
	];
	const albumCovers = [
		"imgs/albums/Rap.jpg",
		"imgs/albums/60s.png",
		"imgs/albums/70s.jpg",
		"imgs/albums/80s.jpg",
		"imgs/albums/90s.png",
		"imgs/albums/2000.jpg",
		"imgs/albums/Movies.jpg	",
		"imgs/albums/Pop.jpg",
		"imgs/albums/VideoGame.jpeg",
		"imgs/albums/Country.jpeg",
		"imgs/albums/French.jpg",
		"imgs/albums/Spanish.jpg",
		"imgs/albums/Jpop.png",
	];

	let room = roomNames[Math.floor(Math.random() * roomNames.length)];
	if (room.includes("%d")) room = room.replaceAll("%d", Math.floor(Math.random() * 1000) + "");

	const themeIndex = Math.floor(Math.random() * themeNames.length);
	const theme = themeNames[themeIndex];
	const img = albumCovers[themeIndex];

	return {
		name: room,
		theme: theme,
		img: img,
		playerCount: Math.floor(Math.random() * 100),
		playerMax: 100,
	};
}

/**
 * @brief Handle mock refresh.
 * @returns New access token if a mock session exists, 401 otherwise.
 */
export const FetchPublicRoom = http.get(API_PUBLIC_ROOMS, async () => {
	const tempRooms: IRoomInfo[] = [];

	GenerateRoom();
	for (let i = 0; i < 20; i++) {
		tempRooms.push(GenerateRoom());
	}

	return HttpResponse.json({ rooms: tempRooms });
});

export const FetchPrivateRoom = http.get(API_PRIVATE_ROOMS, async () => {
	const tempRooms: IRoomInfo[] = [];

	for (let i = 0; i < 10; i++) {
		tempRooms.push(GenerateRoom());
	}

	return HttpResponse.json({ rooms: tempRooms });
});
