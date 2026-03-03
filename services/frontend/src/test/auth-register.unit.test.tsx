import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PRegisterForm from "../pages/PAuthPage/PRegisterForm";
import { API_AUTH_REGISTER } from "../constants";

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

describe("auth register unit tests", () => {
	beforeEach(() => {
		postMock.mockReset();
		setAuthMock.mockReset();
	});

	it("username already taken is refused", async () => {
		const user = userEvent.setup();
		postMock.mockRejectedValue({
			response: { data: { error: { username: "Username already taken" } } },
		});

		render(<PRegisterForm />);

		const submitButton = screen.getByRole("button", { name: /sign in/i });
		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "john");
		await user.type(screen.getByLabelText(/email/i), "john+new@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(submitButton);

		expect(postMock).toHaveBeenCalledWith(API_AUTH_REGISTER, {
			username: "john",
			email: "john+new@42.fr",
			password: "Secret1!",
		});
		expect(await screen.findByText(/username already taken/i)).toBeInTheDocument();
		expect(submitButton).not.toBeDisabled();
		expect(submitButton).toHaveTextContent(/sign in/i);
		expect(setAuthMock).not.toHaveBeenCalled();
	});

	it("email already taken is refused", async () => {
		const user = userEvent.setup();
		postMock.mockRejectedValue({
			response: { data: { error: { email: "Email already taken" } } },
		});

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "new");
		await user.type(screen.getByLabelText(/email/i), "john@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(postMock).toHaveBeenCalledWith(API_AUTH_REGISTER, {
			username: "new",
			email: "john@42.fr",
			password: "Secret1!",
		});
		expect(await screen.findByText(/email already taken/i)).toBeInTheDocument();
		expect(setAuthMock).not.toHaveBeenCalled();
	});

	it("username and email already taken is refused", async () => {
		const user = userEvent.setup();
		postMock.mockRejectedValue({
			response: {
				data: {
					error: { username: "Username already taken", email: "Email already taken" },
				},
			},
		});

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "john");
		await user.type(screen.getByLabelText(/email/i), "john@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(postMock).toHaveBeenCalledWith(API_AUTH_REGISTER, {
			username: "john",
			email: "john@42.fr",
			password: "Secret1!",
		});
		expect(await screen.findByText(/username already taken/i)).toBeInTheDocument();
		expect(await screen.findByText(/email already taken/i)).toBeInTheDocument();
		expect(setAuthMock).not.toHaveBeenCalled();
	});

	it("ignores backend errors for unknown fields", async () => {
		const user = userEvent.setup();
		postMock.mockRejectedValue({
			response: { data: { error: { foo: "Some error" } } },
		});

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "new");
		await user.type(screen.getByLabelText(/email/i), "new@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(screen.queryByText(/some error/i)).not.toBeInTheDocument();
		expect(setAuthMock).not.toHaveBeenCalled();
	});

	it("clears backend field error when user edits that field", async () => {
		const user = userEvent.setup();
		postMock.mockRejectedValue({
			response: { data: { error: { username: "Username already taken" } } },
		});

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "john");
		await user.type(screen.getByLabelText(/email/i), "john+new@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(await screen.findByText(/username already taken/i)).toBeInTheDocument();

		await user.type(screen.getByLabelText(/username/i), "2");

		expect(screen.queryByText(/username already taken/i)).not.toBeInTheDocument();
	});

	it("shows password warnings when password is weak", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(passwordInput, "abc");

		expect(await screen.findByText(/use at least 8 characters/i)).toBeInTheDocument();
		expect(screen.getByText(/include at least 1 number/i)).toBeInTheDocument();
		expect(screen.getByText(/include at least 1 uppercase letter/i)).toBeInTheDocument();
		expect(screen.getByText(/include at least 1 special character/i)).toBeInTheDocument();
	});

	it("renders multiple password warnings as a list", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(passwordInput, "abc");

		const list = await screen.findByRole("list");
		const items = within(list).getAllByRole("listitem");
		expect(items).toHaveLength(4);
	});

	it("clears password warnings when password becomes strong", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(passwordInput, "abc");

		expect(await screen.findByText(/use at least 8 characters/i)).toBeInTheDocument();

		await user.clear(passwordInput);
		await user.type(passwordInput, "Secret1!");

		expect(screen.queryByText(/use at least 8 characters/i)).not.toBeInTheDocument();
	});

	it("shows username length warning when username is too long", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		await user.type(screen.getByLabelText(/username/i), "a".repeat(21));

		expect(await screen.findByText(/username at most 20 characters/i)).toBeInTheDocument();
	});

	it("ignores leading/trailing spaces when checking username length", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		await user.type(screen.getByLabelText(/username/i), ` ${"a".repeat(20)} `);

		expect(screen.queryByText(/username at most 20 characters/i)).not.toBeInTheDocument();
	});

	it("valid username length does not show warning", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		await user.type(screen.getByLabelText(/username/i), "a".repeat(20));

		expect(screen.queryByText(/username at most 20 characters/i)).not.toBeInTheDocument();
	});

	it("no password does not show warnings", async () => {
		render(<PRegisterForm />);

		expect(screen.queryByText(/use at least 8 characters/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 number/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 lowercase letter/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 uppercase letter/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 special character/i)).not.toBeInTheDocument();
	});

	it("trims username and email before submit", async () => {
		const user = userEvent.setup();
		postMock.mockResolvedValue({
			data: { username: "new", access: "token" },
		});

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "  new  ");
		await user.type(screen.getByLabelText(/email/i), "  new@42.fr  ");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(postMock).toHaveBeenCalledWith(API_AUTH_REGISTER, {
			username: "new",
			email: "new@42.fr",
			password: "Secret1!",
		});
	});

	it("shows required errors when submitting empty form", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(screen.getAllByText(/please fill this/i)).toHaveLength(4);
		expect(postMock).not.toHaveBeenCalled();
	});

	it("treats whitespace-only input as empty on submit", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "   ");
		await user.type(screen.getByLabelText(/email/i), "   ");
		await user.type(passwordInput, "   ");
		await user.type(screen.getByLabelText(/confirm password/i), "   ");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(screen.getAllByText(/please fill this/i)).toHaveLength(4);
		expect(postMock).not.toHaveBeenCalled();
	});

	it("confirm password required when password is set", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "new");
		await user.type(screen.getByLabelText(/email/i), "new@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(screen.getAllByText(/please fill this/i)).toHaveLength(1);
		expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
	});

	it("shows mismatch when confirm is filled but password is empty", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		await user.type(screen.getByLabelText(/username/i), "new");
		await user.type(screen.getByLabelText(/email/i), "new@42.fr");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(screen.getAllByText(/please fill this/i)).toHaveLength(1);
		expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
	});

	it("blocks submit when email is invalid", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "new");
		await user.type(screen.getByLabelText(/email/i), "new@");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(postMock).not.toHaveBeenCalled();
		expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
	});

	it("shows mismatch when password changes after confirm matches", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		const confirmInput = screen.getByLabelText(/confirm password/i);

		await user.type(passwordInput, "Secret1!");
		await user.type(confirmInput, "Secret1!");
		expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();

		await user.clear(passwordInput);
		await user.type(passwordInput, "Secret2!");

		expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
	});

	it("valid password does not show warnings", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(passwordInput, "Secret1!");

		expect(screen.queryByText(/use at least 8 characters/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 number/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 lowercase letter/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 uppercase letter/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/include at least 1 special character/i)).not.toBeInTheDocument();
	});

	it("shows mismatch warning when passwords differ", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret2!");

		expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
	});

	it("mismatch warning clears when passwords match", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		const confirmInput = screen.getByLabelText(/confirm password/i);
		await user.type(passwordInput, "Secret1!");
		await user.type(confirmInput, "Secret2!");

		expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();

		await user.clear(confirmInput);
		await user.type(confirmInput, "Secret1!");

		expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
	});

	it("no confirm password does not show mismatch warning", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(passwordInput, "Secret1!");

		expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
	});

	it("valid confirm password does not show mismatch warning", async () => {
		const user = userEvent.setup();

		render(<PRegisterForm />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");

		expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
	});

	it("valid new user is accepted", async () => {
		const user = userEvent.setup();
		const onSuccessMock = vi.fn();
		postMock.mockResolvedValue({
			data: { username: "new", access: "token" },
		});

		render(<PRegisterForm onSuccess={onSuccessMock} />);

		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "new");
		await user.type(screen.getByLabelText(/email/i), "new@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		expect(postMock).toHaveBeenCalledWith(API_AUTH_REGISTER, {
			username: "new",
			email: "new@42.fr",
			password: "Secret1!",
		});
		await waitFor(() =>
			expect(setAuthMock).toHaveBeenCalledWith("token", {
				username: "new",
				email: "new@42.fr",
			}),
		);
		expect(onSuccessMock).toHaveBeenCalledWith({
			username: "new",
			email: "new@42.fr",
		});
	});

	it("disables submit while pending", async () => {
		const user = userEvent.setup();
		const deferred = createDeferred<{ data: { username: string; access: string } }>();
		postMock.mockReturnValueOnce(deferred.promise);

		render(<PRegisterForm />);

		const submitButton = screen.getByRole("button", { name: /sign in/i });
		const [passwordInput] = screen.getAllByLabelText(/password/i);
		await user.type(screen.getByLabelText(/username/i), "new");
		await user.type(screen.getByLabelText(/email/i), "new@42.fr");
		await user.type(passwordInput, "Secret1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Secret1!");
		await user.click(submitButton);

		expect(submitButton).toBeDisabled();
		expect(submitButton).toHaveTextContent(/signing in/i);

		deferred.resolve({ data: { username: "new", access: "token" } });

		await waitFor(() => expect(submitButton).not.toBeDisabled());
	});
});
