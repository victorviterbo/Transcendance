import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CAuthProvider, useAuth } from "../components/auth/CAuthProvider";
import PLoginForm from "../pages/PAuthPage/PLoginForm";
import PRegisterForm from "../pages/PAuthPage/PRegisterForm";

const AuthStatusProbe = () => {
	const { status, user } = useAuth();
	return (
		<div>
			<span data-testid="status">{status}</span>
			<span data-testid="username">{user?.username ?? ""}</span>
		</div>
	);
};

describe("auth integration tests", () => {
	it("logs in with mock db user and sets auth state", async () => {
		const user = userEvent.setup();

		render(
			<CAuthProvider>
				<PLoginForm />
				<AuthStatusProbe />
			</CAuthProvider>,
		);

		await user.type(screen.getByLabelText(/email/i), "john@42.fr");
		await user.type(screen.getByLabelText(/password/i), "secret");
		await user.click(screen.getByRole("button", { name: /log in/i }));

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
		expect(screen.getByTestId("username")).toHaveTextContent("john");
	});

	it("registers a new user via mock db and sets auth state", async () => {
		const user = userEvent.setup();

		render(
			<CAuthProvider>
				<PRegisterForm />
				<AuthStatusProbe />
			</CAuthProvider>,
		);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "alice");
		await user.type(screen.getByLabelText(/email/i), "alice@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
		expect(screen.getByTestId("username")).toHaveTextContent("alice");
	});
});
