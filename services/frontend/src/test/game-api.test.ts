import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublicGames } from "../api/game";

const getMock = vi.fn();

vi.mock("../api/client", () => ({
	default: {
		get: (...args: unknown[]) => getMock(...args),
	},
}));

describe("game api", () => {
	beforeEach(() => {
		getMock.mockReset();
	});

	it("fetches public games from the base game endpoint", async () => {
		getMock.mockResolvedValue({ data: { rooms: [] } });

		await fetchPublicGames();

		expect(getMock).toHaveBeenCalledWith("/api/game/");
	});
});
