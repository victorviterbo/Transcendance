import { describe, expect, it } from "vitest";
import { hasSocialErrorCode } from "../api/social";

describe("social api error code detection", () => {
	it("finds a code in an axios string-field backend error", () => {
		expect(
			hasSocialErrorCode(
				{
					response: {
						data: {
							error: {
								friendship: "FRIENDSHIP_ALREADY_EXISTS",
							},
						},
					},
				},
				"FRIENDSHIP_ALREADY_EXISTS",
			),
		).toBe(true);
	});

	it("finds a code in an axios array-field backend error", () => {
		expect(
			hasSocialErrorCode(
				{
					response: {
						data: {
							error: {
								friendship: [
									{
										message: "friendship not found",
										code: "FRIENDSHIP_NOT_FOUND",
									},
								],
							},
						},
					},
				},
				"FRIENDSHIP_NOT_FOUND",
			),
		).toBe(true);
	});

	it("finds a code in a thrown social error struct", () => {
		expect(
			hasSocialErrorCode(
				{
					friendship: [
						{
							message: "FRIENDSHIP_NOT_FOUND",
							code: "OTHER_CODE",
						},
					],
				},
				"FRIENDSHIP_NOT_FOUND",
			),
		).toBe(true);
	});

	it("does not match unrelated error codes", () => {
		expect(
			hasSocialErrorCode(
				{
					response: {
						data: {
							error: {
								friendship: "REALLY_SAD",
							},
						},
					},
				},
				"FRIENDSHIP_ALREADY_EXISTS",
			),
		).toBe(false);
	});

	it("handles null and primitive errors", () => {
		expect(hasSocialErrorCode(null, "FRIENDSHIP_NOT_FOUND")).toBe(false);
		expect(hasSocialErrorCode("FRIENDSHIP_NOT_FOUND", "FRIENDSHIP_NOT_FOUND")).toBe(true);
	});
});
