import { describe, expect, it } from "vitest";
import { getBadgeForXp } from "../mock/db";

describe("mock badge tiers", () => {
	it("maps XP to the expected badge names", () => {
		expect(getBadgeForXp(0)).toBe("Deaf Octopus");
		expect(getBadgeForXp(99)).toBe("Deaf Octopus");
		expect(getBadgeForXp(100)).toBe("Dazed Jellyfish");
		expect(getBadgeForXp(275)).toBe("Distracted Pigeon");
		expect(getBadgeForXp(999)).toBe("Curious Cat");
		expect(getBadgeForXp(4500)).toBe("Rhythmic Raptor");
		expect(getBadgeForXp(9999)).toBe("Sonic Shark");
		expect(getBadgeForXp(10000)).toBe("Echolocating Bat");
	});
});
