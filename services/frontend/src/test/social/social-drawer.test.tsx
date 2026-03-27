import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CAuthProvider } from "../../components/auth/CAuthProvider";
import { API_AUTH_REFRESH } from "../../constants";
import GPageBase from "../../pages/common/GPageBases";
import userEvent from "@testing-library/user-event";

const getMock = vi.fn();
const postMock = vi.fn();
let accessToken: string | null = null;

vi.mock("../../api", () => ({
	default: {
		get: (...args: unknown[]) => getMock(...args),
		post: (...args: unknown[]) => postMock(...args),
	},
	setAccessToken: (token: string | null) => {
		accessToken = token;
	},
	clearAccessToken: () => {
		accessToken = null;
	},
	getAccessToken: () => accessToken,
	setAuthFailureHandler: (_: (() => void) | null) => {},
}));

function logUser() {
	postMock.mockImplementation((url: string) => {
		if (url === API_AUTH_REFRESH) {
			return Promise.resolve({
				data: { access: "test-access", username: "john" },
			});
		}
		return Promise.reject(new Error(`unexpected call: ${url}`));
	});
}

describe("Socials - Drawer", () => {
	afterEach(() => {
		vi.resetAllMocks();
		getMock.mockReset();
		postMock.mockReset();

		accessToken = null;
	});

	//DRAWER
	it("Friends panel when not logged in", async () => {
		render(
			<MemoryRouter initialEntries={["/"]}>
				<GPageBase />
			</MemoryRouter>,
		);

		expect(screen.queryByTestId("PSocial")).toBeNull();
	});

	it("Friends panel when logged in", async () => {
		logUser();
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<GPageBase />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId("PSocial")).toBeInTheDocument();
		});
	});

	it("Friends panel closed by default", async () => {
		logUser();
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<GPageBase />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId("PSocial")).toBeInTheDocument();
			expect(screen.queryByTestId("PSocialDrawer")).toBeInTheDocument();
		});

		const firstChild = screen.queryByTestId("PSocialDrawer")?.children[0];
		expect(firstChild).not.toBeNull();
		expect(firstChild).not.toBeVisible();
	});

	it("Opening friends panel", async () => {
		logUser();
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<GPageBase />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId("PSocial")).toBeInTheDocument();
			expect(screen.queryByTestId("PSocialDrawer")).toBeInTheDocument();
		});

		const firstChild = screen.queryByTestId("PSocialDrawer")?.children[0];
		expect(firstChild).not.toBeNull();
		expect(firstChild).not.toBeVisible();

		const button = screen.getByTestId("Friends_CIconButton");

		await userEvent.click(button);

		expect(firstChild).toBeVisible();
	});

	it("Switching tabs", async () => {
		logUser();
		render(
			<CAuthProvider>
				<MemoryRouter initialEntries={["/"]}>
					<GPageBase />
				</MemoryRouter>
			</CAuthProvider>,
		);

		await waitFor(() => {
			expect(screen.queryByTestId("PFriendList")).toBeInTheDocument();
			expect(screen.queryByTestId("PFriendAdd")).not.toBeInTheDocument();
		});

		const listButton = screen.getByTestId("PSocialTab0");
		const addButton = screen.getByTestId("PSocialTab1");
		const reqButton = screen.getByTestId("PSocialTab2");
		expect(listButton).toBeInTheDocument();
		expect(addButton).toBeInTheDocument();
		expect(reqButton).toBeInTheDocument();

		await userEvent.click(addButton);

		await waitFor(() => {
			expect(screen.queryByTestId("PFriendList")).not.toBeInTheDocument();
			expect(screen.queryByTestId("PFriendAdd")).toBeInTheDocument();
		});

		await userEvent.click(listButton);

		await waitFor(() => {
			expect(screen.queryByTestId("PFriendList")).toBeInTheDocument();
			expect(screen.queryByTestId("PFriendAdd")).not.toBeInTheDocument();
		});
	});
});
