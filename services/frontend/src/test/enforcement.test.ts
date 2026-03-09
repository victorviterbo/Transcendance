import { describe, expect, it } from "vitest";

import { checkUsernameValid } from "../utils/enforcement";

describe("checkUsernameValid", () => {
	it("rejects usernames containing path traversal dots", () => {
		expect(checkUsernameValid("john..doe")).toContain("USERNAME_FORBIDDEN");
		expect(checkUsernameValid("..john")).toContain("USERNAME_FORBIDDEN");
	});

	it("rejects usernames containing slash characters", () => {
		expect(checkUsernameValid("john/doe")).toContain("USERNAME_FORBIDDEN");
		expect(checkUsernameValid("john\\doe")).toContain("USERNAME_FORBIDDEN");
	});

	it("rejects usernames containing tilde", () => {
		expect(checkUsernameValid("john~doe")).toContain("USERNAME_FORBIDDEN");
	});

	it("rejects reserved username admin", () => {
		expect(checkUsernameValid("admin")).toContain("USERNAME_ADMIN");
		expect(checkUsernameValid("ADMIN")).toContain("USERNAME_ADMIN");
	});

	it("enforces minimum and maximum length", () => {
		expect(checkUsernameValid("ab")).toContain("USERNAME_MIN");
		expect(checkUsernameValid("a".repeat(21))).toContain("USERNAME_MAX");
	});

	it("accepts a valid username", () => {
		expect(checkUsernameValid("johndoe")).toEqual([]);
	});

	it("allows single dot but not path traversal", () => {
		expect(checkUsernameValid("john.doe")).toEqual([]);
	});
});
