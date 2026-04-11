import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_PROFILE } from "../constants";
import { uploadProfileImage } from "../api/profile";

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("../api/client", () => ({
	default: {
		get: (...args: unknown[]) => getMock(...args),
		post: (...args: unknown[]) => postMock(...args),
	},
}));

describe("profile api", () => {
	beforeEach(() => {
		getMock.mockReset();
		postMock.mockReset();
	});

	it("uploads profile avatars using the avatar multipart field", async () => {
		const file = new File(["avatar"], "avatar.png", { type: "image/png" });
		postMock.mockResolvedValue({
			data: {
				username: "john",
				avatar: "/DB/media/default_pp.jpg",
				exp_points: 120,
				badges: "Curious Cat",
				created_at: "2026-04-10T00:00:00Z",
			},
		});

		await uploadProfileImage(file);

		expect(postMock).toHaveBeenCalledTimes(1);
		const [url, formData] = postMock.mock.calls[0] as [string, FormData];
		expect(url).toBe(API_PROFILE);
		expect(formData).toBeInstanceOf(FormData);
		expect(formData.get("avatar")).toBe(file);
		expect(formData.get("image")).toBeNull();
	});
});
