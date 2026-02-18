import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PLoginForm from "../pages/PAuthPage/PLoginForm";
import { API_AUTH_LOGIN } from "../constants";

const postMock = vi.fn();
const setAuthMock = vi.fn();

const createDeferred = <T,>() => {
	let resolve: (value: T) => void = () => {};
	let reject: (error: unknown) => void = () => {};
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
};

vi.mock("../api", () => ({
	default: {
		post: (...args: unknown[]) => postMock(...args),
	},
}));

vi.mock("../components/auth/CAuthProvider", () => ({
	useAuth: () => ({ setAuth: setAuthMock }),
}));

describe("auth login unit tests", () => {
	beforeEach(() => {
		postMock.mockReset();
		setAuthMock.mockReset();
	});

	it("unknown user is refused", async () => {
		const user = userEvent.setup();
		postMock.mockRejectedValue({
			response: { data: { error: "Wrong email or password" } },
		});

		render(<PLoginForm />);

		const submitButton = screen.getByRole("button", { name: /log in/i });
		await user.type(screen.getByLabelText(/email/i), "unknown@42.fr");
		await user.type(screen.getByLabelText(/password/i), "whocares");
		await user.click(submitButton);

		expect(postMock).toHaveBeenCalledWith(API_AUTH_LOGIN, {
			email: "unknown@42.fr",
			password: "whocares",
		});
		expect(await screen.findByText(/wrong email or password/i)).toBeInTheDocument();
		expect(submitButton).not.toBeDisabled();
		expect(submitButton).toHaveTextContent(/log in/i);
		expect(setAuthMock).not.toHaveBeenCalled();
	});

	it("known user with invalid password is refused", async () => {
		const user = userEvent.setup();
		postMock.mockRejectedValue({
			response: { data: { error: "Wrong email or password" } },
		});

		render(<PLoginForm />);

		await user.type(screen.getByLabelText(/email/i), "john@42.fr");
		await user.type(screen.getByLabelText(/password/i), "wrong");
		await user.click(screen.getByRole("button", { name: /log in/i }));

		expect(postMock).toHaveBeenCalledWith(API_AUTH_LOGIN, {
			email: "john@42.fr",
			password: "wrong",
		});
		expect(await screen.findByText(/wrong email or password/i)).toBeInTheDocument();
		expect(setAuthMock).not.toHaveBeenCalled();
	});

	it("known user with valid password is accepted", async () => {
		const user = userEvent.setup();
		const onSuccessMock = vi.fn();
		postMock.mockResolvedValue({
			data: { username: "john", access: "token" },
		});

		render(<PLoginForm onSuccess={onSuccessMock} />);

		await user.type(screen.getByLabelText(/email/i), "john@42.fr");
		await user.type(screen.getByLabelText(/password/i), "secret");
		await user.click(screen.getByRole("button", { name: /log in/i }));

		expect(postMock).toHaveBeenCalledWith(API_AUTH_LOGIN, {
			email: "john@42.fr",
			password: "secret",
		});
		await waitFor(() =>
			expect(setAuthMock).toHaveBeenCalledWith("token", {
				username: "john",
				email: "john@42.fr",
			}),
		);
		expect(onSuccessMock).toHaveBeenCalledWith({
			username: "john",
			email: "john@42.fr",
		});
	});

	it("disables submit while pending", async () => {
		const user = userEvent.setup();
		const deferred = createDeferred<{ data: { username: string; access: string } }>();
		postMock.mockReturnValueOnce(deferred.promise);

		render(<PLoginForm />);

		const submitButton = screen.getByRole("button", { name: /log in/i });
		await user.type(screen.getByLabelText(/email/i), "john@42.fr");
		await user.type(screen.getByLabelText(/password/i), "secret");
		await user.click(submitButton);

		expect(submitButton).toBeDisabled();
		expect(submitButton).toHaveTextContent(/logging in/i);

		deferred.resolve({ data: { username: "john", access: "token" } });

		await waitFor(() => expect(submitButton).not.toBeDisabled());
	});
});
