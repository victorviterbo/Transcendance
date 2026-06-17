import { http, HttpResponse } from "msw";
import { API_GAME_FRIENDS, API_GAME_PUBLIC, MUSIC_TAGS } from "../../constants";
import type { IGameListEntry, TGameGenre } from "../../types/game";

let roomUidCounter = 0;

function generateRoomUid(): string {
	roomUidCounter += 1;
	return `00000000-0000-4000-8000-${roomUidCounter.toString().padStart(12, "0")}`;
}

function GenerateRoom(genreCount?: number): IGameListEntry {
	const roomNames = [
		"Sarah's room",
		"Carl's room",
		"80's room",
		"Today challenge",
		"Today playlist",
		"Public room %d",
	];

	let room = roomNames[Math.floor(Math.random() * roomNames.length)];
	if (room.includes("%d")) room = room.replaceAll("%d", Math.floor(Math.random() * 1000) + "");

	const genres = [...MUSIC_TAGS]
		.sort(() => Math.random() - 0.5)
		.slice(0, genreCount ?? Math.floor(Math.random() * 4)) as TGameGenre[];

	return {
		uid: generateRoomUid(),
		name: room,
		genres,
		playerCount: Math.floor(Math.random() * 100),
		playerMax: 100,
	};
}

export const FetchPublicRoom = http.get(API_GAME_PUBLIC, async () => {
	const tempRooms: IGameListEntry[] = [];

	GenerateRoom();
	for (let i = 0; i < 15; i++) {
		tempRooms.push(GenerateRoom(i % 5 === 0 ? MUSIC_TAGS.length : undefined));
	}

	return HttpResponse.json({ rooms: tempRooms });
});

export const FetchPrivateRoom = http.get(API_GAME_FRIENDS, async () => {
	const tempRooms: IGameListEntry[] = [];

	tempRooms.push({
		uid: "join-speed",
		name: "Join Speed",
		genres: [...MUSIC_TAGS],
		playerCount: Math.floor(Math.random() * 100),
		playerMax: 100,
	});

	tempRooms.push({
		uid: "ended",
		name: "Ended room",
		genres: [...MUSIC_TAGS],
		playerCount: Math.floor(Math.random() * 100),
		playerMax: 100,
	});

	tempRooms.push({
		uid: "error",
		name: "Error room",
		genres: [...MUSIC_TAGS],
		playerCount: Math.floor(Math.random() * 100),
		playerMax: 100,
	});

	tempRooms.push({
		uid: "full",
		name: "Error full room",
		genres: [...MUSIC_TAGS],
		playerCount: Math.floor(Math.random() * 100),
		playerMax: 100,
	});

	tempRooms.push({
		uid: "in-game",
		name: "Error In Game",
		genres: [...MUSIC_TAGS],
		playerCount: Math.floor(Math.random() * 100),
		playerMax: 100,
	});

	for (let i = 0; i < 10; i++) {
		tempRooms.push(GenerateRoom(i % 5 === 0 ? MUSIC_TAGS.length : undefined));
	}

	return HttpResponse.json({ rooms: tempRooms });
});
