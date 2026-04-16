import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PProfilePublic from "../pages/PProfilePage/PProfilePublic";
import type { IProfileData } from "../types/profile";

const fetchProfileMock = vi.fn();

vi.mock("../api/profile", () => ({
	fetchProfile: (...args: unknown[]) => fetchProfileMock(...args),
	getProfileLevelProgress: () => ({ level: 1, progressPercent: 20 }),
	resolveProfileImage: () => undefined,
}));

vi.mock("../pages/common/GPageBases", () => ({
	default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../components/navigation/CTabs", () => ({
	default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../pages/PProfilePage/PProfileStatisticsPanel", () => ({
	default: () => <div>PROFILE_STATISTICS</div>,
}));

vi.mock("../pages/PProfilePage/PProfileMatchHistoryPanel", () => ({
	default: () => <div>PROFILE_MATCH_HISTORY</div>,
}));

const createDeferred = <T,>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((nextResolve, nextReject) => {
		resolve = nextResolve;
		reject = nextReject;
	});
	return { promise, resolve, reject };
};

describe("PProfilePublic", () => {
	beforeEach(() => {
		fetchProfileMock.mockReset();
	});

	it("does not show the not found page while the current profile is still loading", async () => {
		const deferred = createDeferred<IProfileData>();
		fetchProfileMock.mockReturnValue(deferred.promise);

		render(
			<MemoryRouter>
				<PProfilePublic username="john" />
			</MemoryRouter>,
		);

		expect(fetchProfileMock).toHaveBeenCalledWith("john");
		expect(screen.getByText("PROFILE_LOADING")).toBeInTheDocument();
		expect(screen.queryByText("USER_NOT_FOUND")).not.toBeInTheDocument();

		deferred.resolve({
			username: "john",
			avatar: null,
			exp_points: 120,
			badges: "Curious Cat",
			created_at: "2026-04-12T00:00:00Z",
			email: "john@42.fr",
		});

		expect(await screen.findByText("john")).toBeInTheDocument();
		expect(screen.queryByText("USER_NOT_FOUND")).not.toBeInTheDocument();
	});

	it("shows the missing user page only for actual profile not found responses", async () => {
		fetchProfileMock.mockRejectedValue({
			response: {
				status: 400,
				data: { error: { query: "USER_NOT_FOUND" } },
			},
		});

		render(
			<MemoryRouter>
				<PProfilePublic username="ghost" />
			</MemoryRouter>,
		);

		expect(await screen.findByText("USER_NOT_FOUND")).toBeInTheDocument();
		expect(screen.queryByText("PROFILE_LOADING")).not.toBeInTheDocument();
	});

	it("shows a generic error for non not found fetch failures", async () => {
		fetchProfileMock.mockRejectedValue({
			response: {
				status: 500,
				data: { error: "Server exploded" },
			},
		});

		render(
			<MemoryRouter>
				<PProfilePublic username="john" />
			</MemoryRouter>,
		);

		expect(await screen.findByText("Server exploded")).toBeInTheDocument();
		expect(screen.queryByText("USER_NOT_FOUND")).not.toBeInTheDocument();
	});
});
