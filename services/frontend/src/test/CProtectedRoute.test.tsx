import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CProtectedRoute from "../components/auth/CProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("./CAuthProvider", () => ({
	useAuth: () => mockUseAuth(),
}));

describe("CProtectedRoute", () => {
	beforeEach(() => {
		mockUseAuth.mockReset();
	});

	it("redirects guests to /auth", () => {
		mockUseAuth.mockReturnValue({ status: "guest" });

		render(
			<MemoryRouter initialEntries={["/private"]}>
				<Routes>
					<Route element={<CProtectedRoute />}>
						<Route path="/private" element={<div>Secret</div>} />
					</Route>
					<Route path="/auth" element={<div>Auth Page</div>} />
				</Routes>
			</MemoryRouter>,
		);

		expect(screen.getByText("Auth Page")).toBeInTheDocument();
	});

	it("renders children for authed users", () => {
		mockUseAuth.mockReturnValue({ status: "authed" });

		render(
			<MemoryRouter initialEntries={["/private"]}>
				<Routes>
					<Route element={<CProtectedRoute />}>
						<Route path="/private" element={<div>Secret</div>} />
					</Route>
					<Route path="/auth" element={<div>Auth Page</div>} />
				</Routes>
			</MemoryRouter>,
		);

		expect(screen.getByText("Secret")).toBeInTheDocument();
	});

	it("renders loading state while auth is loading", () => {
		mockUseAuth.mockReturnValue({ status: "loading" });

		render(
			<MemoryRouter initialEntries={["/private"]}>
				<Routes>
					<Route element={<CProtectedRoute />}>
						<Route path="/private" element={<div>Secret</div>} />
					</Route>
				</Routes>
			</MemoryRouter>,
		);

		expect(screen.getByText(/loading/i)).toBeInTheDocument();
	});
});
