import { describe, expect, it } from "vitest";
import api from "../api";
import { API_PROFILE, API_PROFILE_PASSWORD } from "../constants";
import { db } from "../mock/db";

describe("profile mock endpoints", () => {
	it("updates the authenticated username through the profile endpoint", async () => {
		db.setSessionUser("john");

		const response = await api.post(API_PROFILE, {
			username: "marc",
		});

		expect(response.status).toBe(200);
		expect(response.data.username).toBe("marc");
		expect(db.findUserByExactUsername("marc")).not.toBeNull();
		expect(db.getSessionUser()?.username).toBe("marc");
	});

	it("rejects a username already taken", async () => {
		db.setSessionUser("john");
		db.createUser("alice", "alice@42.fr", "Secret1!");

		await expect(
			api.post(API_PROFILE, {
				username: "alice",
			}),
		).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						username: "USERNAME_TAKEN",
					},
				},
			},
		});
	});

	it("updates the authenticated email through the profile endpoint", async () => {
		db.setSessionUser("john");

		const response = await api.post(API_PROFILE, {
			email: "marc@42.fr",
		});

		expect(response.status).toBe(200);
		expect(response.data.email).toBe("marc@42.fr");
		expect(db.findUserByExactUsername("john")?.email).toBe("marc@42.fr");
	});

	it("rejects an email already taken", async () => {
		db.setSessionUser("john");
		db.createUser("alice", "alice@42.fr", "Secret1!");

		await expect(
			api.post(API_PROFILE, {
				email: "alice@42.fr",
			}),
		).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						email: "EMAIL_TAKEN",
					},
				},
			},
		});
	});

	it("rejects a missing current password", async () => {
		db.setSessionUser("john");

		await expect(
			api.post(API_PROFILE_PASSWORD, {
				currentPassword: "",
				newPassword: "NewSecret123+",
			}),
		).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						currentPassword: "MISSING_FIELD",
					},
				},
			},
		});
	});

	it("rejects an invalid current password", async () => {
		db.setSessionUser("john");

		await expect(
			api.post(API_PROFILE_PASSWORD, {
				currentPassword: "wrong",
				newPassword: "NewSecret123+",
			}),
		).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						currentPassword: "INVALID_PASSWORD",
					},
				},
			},
		});
	});

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

	it("rejects deleting a profile with a missing password", async () => {
		db.setSessionUser("john");

		await expect(
			api.delete(API_PROFILE, {
				data: { password: "" },
			}),
		).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						password: "MISSING_FIELD",
					},
				},
			},
		});
	});

	it("rejects deleting a profile with a wrong password", async () => {
		db.setSessionUser("john");

		await expect(
			api.delete(API_PROFILE, {
				data: { password: "wrong" },
			}),
		).rejects.toMatchObject({
			response: {
				status: 400,
				data: {
					error: {
						password: "INVALID_PASSWORD",
					},
				},
			},
		});
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
