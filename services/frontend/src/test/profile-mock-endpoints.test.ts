import { describe, expect, it } from "vitest";
import api from "../api";
import { API_PROFILE, API_PROFILE_PASSWORD } from "../constants";
import { db } from "../mock/db";

describe("profile mock endpoints", () => {
	it("rejects a new password identical to the current one", async () => {
		db.setSessionUser("john");

		await expect(
			api.post(API_PROFILE_PASSWORD, {
				currentPassword: "secret",
				newPassword: "secret",
			}),
		).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						newPassword: "PASSWORD_UNCHANGED",
					},
				},
			},
		});
	});

	it("changes the password through the dedicated profile endpoint", async () => {
		db.setSessionUser("john");

		const response = await api.post(API_PROFILE_PASSWORD, {
			currentPassword: "secret",
			newPassword: "NewSecret123+",
		});

		expect(response.status).toBe(200);
		expect(db.authenticate("john@42.fr", "secret")).toBeNull();
		expect(db.authenticate("john@42.fr", "NewSecret123+")).not.toBeNull();
	});

	it("deletes the authenticated profile when the password matches", async () => {
		db.setSessionUser("john");

		const response = await api.delete(API_PROFILE, {
			data: { password: "secret" },
		});

		expect(response.status).toBe(204);
		expect(db.findUserByExactUsername("john")).toBeNull();
		expect(db.getSessionUser()).toBeNull();
	});
});
