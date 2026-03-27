import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CForm from "../components/layout/CForm";

describe("CForm", () => {
	it("shows a success message and resets fields when requested", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue({
			valid: true,
			msg: "CHANGE_SUCCESS",
			resetOnSuccess: true,
		});

		render(
			<CForm
				submitText="CHANGE"
				fields={[{ name: "username", label: "NEW_USERNAME", required: true }]}
				onSubmit={onSubmit}
			/>,
		);

		const input = screen.getByLabelText(/new_username/i);
		await user.type(input, "new_name");
		await user.click(screen.getByRole("button", { name: /change/i }));

		await waitFor(() => expect(screen.getByText("CHANGE_SUCCESS")).toBeInTheDocument());
		expect(onSubmit).toHaveBeenCalledWith({ username: "new_name" });
		expect(input).toHaveValue("");
	});

	it("keeps values after a success when reset is not requested", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue({
			valid: true,
			msg: "CHANGE_SUCCESS",
		});

		render(
			<CForm
				submitText="CHANGE"
				fields={[{ name: "email", label: "NEW_EMAIL", required: true }]}
				onSubmit={onSubmit}
			/>,
		);

		const input = screen.getByLabelText(/new_email/i);
		await user.type(input, "john@42.fr");
		await user.click(screen.getByRole("button", { name: /change/i }));

		await waitFor(() => expect(screen.getByText("CHANGE_SUCCESS")).toBeInTheDocument());
		expect(input).toHaveValue("john@42.fr");
	});

	it("clears a success message when the user edits the form again", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockResolvedValue({
			valid: true,
			msg: "CHANGE_SUCCESS",
		});

		render(
			<CForm
				submitText="CHANGE"
				fields={[{ name: "username", label: "NEW_USERNAME", required: true }]}
				onSubmit={onSubmit}
			/>,
		);

		const input = screen.getByLabelText(/new_username/i);
		await user.type(input, "new_name");
		await user.click(screen.getByRole("button", { name: /change/i }));
		await waitFor(() => expect(screen.getByText("CHANGE_SUCCESS")).toBeInTheDocument());

		await user.type(input, "2");

		expect(screen.queryByText("CHANGE_SUCCESS")).not.toBeInTheDocument();
	});
});
