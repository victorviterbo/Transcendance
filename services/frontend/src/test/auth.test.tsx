import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CAuthProvider, useAuth } from "../components/auth/CAuthProvider";
import { API_AUTH_LOGOUT, API_AUTH_REFRESH } from "../constants";
import { getAccessToken } from "../api";

const postMock = vi.fn();
let accessToken: string | null = null;
let authFailureHandler: (() => void) | null = null;

vi.mock("../api", () => ({
	default: {
		post: (...args: unknown[]) => postMock(...args),
	},
	setAccessToken: (token: string | null) => {
		accessToken = token;
	},
	clearAccessToken: () => {
		accessToken = null;
	},
	getAccessToken: () => accessToken,
	setAuthFailureHandler: (handler: (() => void) | null) => {
		authFailureHandler = handler;
	},
}));

const AuthStatusProbe = () => {
	const { status, user } = useAuth();
	return (
		<div>
			<span data-testid="status">{status}</span>
			<span data-testid="username">{user?.username ?? ""}</span>
		</div>
	);
};

const AuthActions = () => {
	const { logout } = useAuth();
	return <button onClick={logout}>Logout</button>;
};

describe("auth flows", () => {
	beforeEach(() => {
		postMock.mockReset();
		accessToken = null;
		authFailureHandler = null;
	});

	it("hydrates auth state from refresh", async () => {
		postMock.mockResolvedValue({
			data: { access: "test-access", username: "john" },
		});

		render(
			<CAuthProvider>
				<AuthStatusProbe />
			</CAuthProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
		expect(screen.getByTestId("username")).toHaveTextContent("john");
	});

	it("sets guest state when refresh fails", async () => {
		postMock.mockRejectedValue(new Error("refresh failed"));

		render(
			<CAuthProvider>
				<AuthStatusProbe />
			</CAuthProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
		expect(screen.getByTestId("username")).toHaveTextContent("");
	});

	it("logout clears auth state and token", async () => {
		const user = userEvent.setup();
		let logoutCalled = false;
		postMock.mockImplementation((url: string) => {
			if (url === API_AUTH_REFRESH) {
				if (logoutCalled) {
					return Promise.reject(new Error("refresh expired"));
				}
				return Promise.resolve({
					data: { access: "test-access", username: "john" },
				});
			}
			if (url === API_AUTH_LOGOUT) {
				logoutCalled = true;
				return Promise.resolve({ data: {} });
			}
			return Promise.reject(new Error(`unexpected call: ${url}`));
		});

		render(
			<CAuthProvider>
				<AuthStatusProbe />
				<AuthActions />
			</CAuthProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
		expect(screen.getByTestId("username")).toHaveTextContent("john");

		await user.click(screen.getByRole("button", { name: /logout/i }));

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
		expect(screen.getByTestId("username")).toHaveTextContent("");
		expect(getAccessToken()).toBe(null);
	});

	it("auth failure handler clears auth state", async () => {
		postMock
			.mockResolvedValueOnce({
				data: { access: "test-access", username: "john" },
			})
			.mockRejectedValueOnce(new Error("refresh expired"))
			.mockRejectedValueOnce(new Error("refresh expired"));

		render(
			<CAuthProvider>
				<AuthStatusProbe />
			</CAuthProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
		expect(authFailureHandler).not.toBeNull();

		authFailureHandler?.();

		await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
		expect(screen.getByTestId("username")).toHaveTextContent("");
	});
});
