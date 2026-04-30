import { http, HttpResponse } from "msw";
import { API_GAME } from "../../../constants";
import type { IGameDataRes } from "../../../types/game";
import { mockGetGameData } from "./game_db";

export const gameRequestHandler = http.get(API_GAME.replaceAll("{ROOMID}", "123456"), async () => {
	const isError: boolean = false;
	if (isError)
		return HttpResponse.json({error: {
					default: [
						{ message: "Game is disabled", code: "Can't fecth game data" },
					],
				},
			},
			{ status: isError ? 400 : 200 },
		);
	return HttpResponse.json({game: mockGetGameData("123456")} as IGameDataRes);
});