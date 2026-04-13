import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PProfileMe from "../pages/PProfilePage/PProfileMe";
import type { IProfileData } from "../types/profile";

const fetchProfileMock = vi.fn();

vi.mock("../api/profile", () => ({
	fetchProfile: (...args: unknown[]) => fetchProfileMock(...args),
	getProfileLevelProgress: () => ({ level: 1, progressPercent: 20 }),
}));

vi.mock("../components/auth/CAuthProvider", () => ({
	useAuth: () => ({
		user: { username: "john" },
	}),
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

vi.mock("../pages/PProfilePage/PProfileSettingsPanel", () => ({
	default: () => <div>PROFILE_SETTINGS_PANEL</div>,
}));

vi.mock("../pages/PProfilePage/PProfileAvatarEditor", () => ({
	default: ({ username }: { username: string }) => <div>AVATAR_EDITOR_{username}</div>,
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

describe("PProfileMe", () => {
	beforeEach(() => {
		fetchProfileMock.mockReset();
	});

	it("uses the shared loading state until the profile request completes", async () => {
		const deferred = createDeferred<IProfileData>();
		fetchProfileMock.mockReturnValue(deferred.promise);

		render(<PProfileMe />);

		expect(fetchProfileMock).toHaveBeenCalledWith("john");
		expect(screen.getByText("PROFILE_LOADING")).toBeInTheDocument();

		deferred.resolve({
			username: "john",
			avatar: null,
			exp_points: 120,
			badges: "Curious Cat",
			created_at: "2026-04-12T00:00:00Z",
			email: "john@42.fr",
		});

		expect(await screen.findByText("john")).toBeInTheDocument();
		expect(screen.queryByText("PROFILE_LOADING")).not.toBeInTheDocument();
	});

	it("uses the shared error state when loading the profile fails", async () => {
		fetchProfileMock.mockRejectedValue({});

		render(<PProfileMe />);

		expect(await screen.findByText("PROFILE_LOAD_FAILED")).toBeInTheDocument();
	});
});
