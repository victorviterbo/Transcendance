import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PProfileSettingsPanel from "../pages/PProfilePage/PProfileSettingsPanel";
import { API_PROFILE } from "../constants";

const postMock = vi.fn();
const getAccessTokenMock = vi.fn();
const setAuthMock = vi.fn();
const logoutMock = vi.fn();
const changeProfilePasswordMock = vi.fn();
const deleteProfileMock = vi.fn();

vi.mock("../api", () => ({
	default: {
		post: (...args: unknown[]) => postMock(...args),
	},
	getAccessToken: () => getAccessTokenMock(),
}));

vi.mock("../components/auth/CAuthProvider", () => ({
	useAuth: () => ({
		setAuth: setAuthMock,
		user: { username: "john", email: "john@42.fr" },
		logout: logoutMock,
	}),
}));

vi.mock("../api/profile", () => ({
	changeProfilePassword: (...args: unknown[]) => changeProfilePasswordMock(...args),
	deleteProfile: (...args: unknown[]) => deleteProfileMock(...args),
}));

describe("profile settings panel", () => {
	beforeEach(() => {
		postMock.mockReset();
		getAccessTokenMock.mockReset();
		setAuthMock.mockReset();
		logoutMock.mockReset();
		changeProfilePasswordMock.mockReset();
		deleteProfileMock.mockReset();
	});

	it("shows success feedback and updates auth state when username changes", async () => {
		const user = userEvent.setup();
		postMock.mockResolvedValue({});
		getAccessTokenMock.mockReturnValue("token");

		render(<PProfileSettingsPanel username="john" />);

		const input = screen.getByLabelText(/new_username/i);
		await user.type(input, "marc");
		await user.click(screen.getByRole("button", { name: /^change$/i }));

		expect(postMock).toHaveBeenCalledWith(`${API_PROFILE}?q=john`, {
			username: "marc",
		});
		await waitFor(() =>
			expect(setAuthMock).toHaveBeenCalledWith("token", {
				username: "marc",
				email: "john@42.fr",
			}),
		);
		expect(screen.getByText("CHANGE_SUCCESS")).toBeInTheDocument();
		expect(input).toHaveValue("");
	});

	it("shows success feedback and updates auth state when email changes", async () => {
		const user = userEvent.setup();
		postMock.mockResolvedValue({});
		getAccessTokenMock.mockReturnValue("token");

		render(<PProfileSettingsPanel username="john" />);

		await user.click(screen.getByRole("button", { name: /change_email/i }));
		const input = await screen.findByLabelText(/new_email/i);
		await user.type(input, "marc@42.fr");
		await user.click(screen.getByRole("button", { name: /^change$/i }));

		expect(postMock).toHaveBeenCalledWith(`${API_PROFILE}?q=john`, {
			email: "marc@42.fr",
		});
		await waitFor(() =>
			expect(setAuthMock).toHaveBeenCalledWith("token", {
				username: "john",
				email: "marc@42.fr",
			}),
		);
		expect(screen.getByText("CHANGE_SUCCESS")).toBeInTheDocument();
		expect(input).toHaveValue("");
	});

	it("shows backend password errors on the password form", async () => {
		const user = userEvent.setup();
		changeProfilePasswordMock.mockRejectedValue({
			response: { data: { error: { newPassword: "PASSWORD_UNCHANGED" } } },
		});

		render(<PProfileSettingsPanel username="john" />);

		const passwordSummary = screen.getByRole("button", { name: /change_password/i });
		await user.click(passwordSummary);
		const passwordPanel = passwordSummary.closest(".MuiAccordion-root");
		expect(passwordPanel).toBeInstanceOf(HTMLElement);
		if (!(passwordPanel instanceof HTMLElement)) {
			throw new Error("Password panel not found");
		}

		await user.type(within(passwordPanel).getByLabelText(/current_password/i), "Secret1!");
		await user.type(within(passwordPanel).getByLabelText(/^new_password$/i), "Secret1!");
		await user.type(within(passwordPanel).getByLabelText(/confirm_new_password/i), "Secret1!");
		await user.click(within(passwordPanel).getByRole("button", { name: /^change$/i }));

		await waitFor(() =>
			expect(changeProfilePasswordMock).toHaveBeenCalledWith("Secret1!", "Secret1!"),
		);
		expect(screen.getByText("PASSWORD_UNCHANGED")).toBeInTheDocument();
	});

	it("replaces auth state with the fresh token after a password change", async () => {
		const user = userEvent.setup();
		changeProfilePasswordMock.mockResolvedValue({
			description: "PASSWORD_UPDATED",
			access: "fresh-token",
			username: "john",
		});

		render(<PProfileSettingsPanel username="john" />);

		const passwordSummary = screen.getByRole("button", { name: /change_password/i });
		await user.click(passwordSummary);
		const passwordPanel = passwordSummary.closest(".MuiAccordion-root");
		expect(passwordPanel).toBeInstanceOf(HTMLElement);
		if (!(passwordPanel instanceof HTMLElement)) {
			throw new Error("Password panel not found");
		}

		await user.type(within(passwordPanel).getByLabelText(/current_password/i), "Secret1!");
		await user.type(within(passwordPanel).getByLabelText(/^new_password$/i), "NewSecret123+");
		await user.type(
			within(passwordPanel).getByLabelText(/confirm_new_password/i),
			"NewSecret123+",
		);
		await user.click(within(passwordPanel).getByRole("button", { name: /^change$/i }));

		await waitFor(() =>
			expect(setAuthMock).toHaveBeenCalledWith("fresh-token", {
				username: "john",
				email: "john@42.fr",
			}),
		);
		expect(screen.getByText("CHANGE_SUCCESS")).toBeInTheDocument();
	});

	it("opens a confirmation dialog before deleting the profile", async () => {
		const user = userEvent.setup();

		render(<PProfileSettingsPanel username="john" />);

		await user.click(screen.getByRole("button", { name: /delete_account/i }));
		await user.type(screen.getByLabelText(/^password$/i), "secret");
		await user.type(screen.getByLabelText(/confirm_password/i), "secret");
		await user.click(screen.getByRole("button", { name: /^delete$/i }));

		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText("DELETE_ACCOUNT_CONFIRMATION")).toBeInTheDocument();
		expect(deleteProfileMock).not.toHaveBeenCalled();
	});

	it("does not delete the profile when the confirmation dialog is cancelled", async () => {
		const user = userEvent.setup();

		render(<PProfileSettingsPanel username="john" />);

		await user.click(screen.getByRole("button", { name: /delete_account/i }));
		await user.type(screen.getByLabelText(/^password$/i), "secret");
		await user.type(screen.getByLabelText(/confirm_password/i), "secret");
		await user.click(screen.getByRole("button", { name: /^delete$/i }));

		const dialog = await screen.findByRole("dialog");
		await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

		expect(deleteProfileMock).not.toHaveBeenCalled();
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	});

	it("deletes the profile only after the user confirms", async () => {
		const user = userEvent.setup();
		deleteProfileMock.mockResolvedValue(undefined);

		render(<PProfileSettingsPanel username="john" />);

		await user.click(screen.getByRole("button", { name: /delete_account/i }));
		await user.type(screen.getByLabelText(/^password$/i), "secret");
		await user.type(screen.getByLabelText(/confirm_password/i), "secret");
		await user.click(screen.getByRole("button", { name: /^delete$/i }));

		const dialog = await screen.findByRole("dialog");
		await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

		await waitFor(() => expect(deleteProfileMock).toHaveBeenCalledWith("secret"));
		expect(logoutMock).toHaveBeenCalled();
	});
});
