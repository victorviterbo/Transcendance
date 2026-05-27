import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PCreateRoom from "../pages/PHomePage/PCreateRoom";

const { createGameMock, navigateMock } = vi.hoisted(() => ({
	createGameMock: vi.fn(),
	navigateMock: vi.fn(),
}));

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
	createGame: (...args: unknown[]) => createGameMock(...args),
}));

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

describe("PCreateRoom", () => {
	beforeEach(() => {
		createGameMock.mockReset();
		navigateMock.mockReset();
	});

	it("starts with private visibility and a disabled create button", () => {
		render(<PCreateRoom />);

		expect(screen.getByLabelText(/game_name/i)).toHaveValue("");
		expect(screen.getByRole("button", { name: /create_game/i })).toBeDisabled();
		expect(screen.getByRole("button", { name: /private/i })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("enables the create button when the room name has non-whitespace content", async () => {
		const user = userEvent.setup();

		render(<PCreateRoom />);

		const createButton = screen.getByRole("button", { name: /create_game/i });
		await user.type(screen.getByLabelText(/game_name/i), "   ");
		expect(createButton).toBeDisabled();

		await user.type(screen.getByLabelText(/game_name/i), "Room");
		expect(createButton).not.toBeDisabled();
	});

	it("creates a private room by default and navigates to the created game", async () => {
		const user = userEvent.setup();
		createGameMock.mockResolvedValue({ uid: "87de2119-1226-479c-9261-c3c4f4b04b31" });

		render(<PCreateRoom />);

		await user.type(screen.getByLabelText(/game_name/i), "  Sarah's room  ");
		await user.click(screen.getByRole("button", { name: /create_game/i }));

		expect(createGameMock).toHaveBeenCalledWith({
			name: "Sarah's room",
			visibility: "private",
		});
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith(
				"/game/87de2119-1226-479c-9261-c3c4f4b04b31",
			),
		);
	});

	it("creates a public room when public visibility is selected", async () => {
		const user = userEvent.setup();
		createGameMock.mockResolvedValue({ uid: "public-room-uid" });

		render(<PCreateRoom />);

		await user.type(screen.getByLabelText(/game_name/i), "Public room");
		await user.click(screen.getByRole("button", { name: /public/i }));
		await user.click(screen.getByRole("button", { name: /create_game/i }));

		expect(createGameMock).toHaveBeenCalledWith({
			name: "Public room",
			visibility: "public",
		});
		expect(navigateMock).toHaveBeenCalledWith("/game/public-room-uid");
	});

	it("creates a friends room when friends visibility is selected", async () => {
		const user = userEvent.setup();
		createGameMock.mockResolvedValue({ uid: "friends-room-uid" });

		render(<PCreateRoom />);

		await user.type(screen.getByLabelText(/game_name/i), "Friends room");
		await user.click(screen.getByRole("button", { name: /friends/i }));
		await user.click(screen.getByRole("button", { name: /create_game/i }));

		expect(createGameMock).toHaveBeenCalledWith({
			name: "Friends room",
			visibility: "friends",
		});
		expect(navigateMock).toHaveBeenCalledWith("/game/friends-room-uid");
	});

	it("disables the create button and shows creating text while creation is pending", async () => {
		const user = userEvent.setup();
		const deferred = createDeferred<{ uid: string }>();
		createGameMock.mockReturnValueOnce(deferred.promise);

		render(<PCreateRoom />);

		await user.type(screen.getByLabelText(/game_name/i), "Slow room");
		const createButton = screen.getByRole("button", { name: /create_game/i });
		await user.click(createButton);

		expect(createButton).toBeDisabled();
		expect(createButton).toHaveTextContent(/creating_game/i);

		deferred.resolve({ uid: "slow-room-uid" });

		await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/game/slow-room-uid"));
	});

	it("shows backend error codes and does not navigate on failure", async () => {
		const user = userEvent.setup();
		createGameMock.mockRejectedValue({
			response: { data: { error: { game: "ALREADY_IN_GAME" } } },
		});

		render(<PCreateRoom />);

		await user.type(screen.getByLabelText(/game_name/i), "Blocked room");
		await user.click(screen.getByRole("button", { name: /create_game/i }));

		expect(await screen.findByText("ALREADY_IN_GAME")).toBeInTheDocument();
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("shows the fallback creation error when the backend payload is not structured", async () => {
		const user = userEvent.setup();
		createGameMock.mockRejectedValue(new Error("Network error"));

		render(<PCreateRoom />);

		await user.type(screen.getByLabelText(/game_name/i), "Network room");
		await user.click(screen.getByRole("button", { name: /create_game/i }));

		expect(await screen.findByText("GAME_CREATION_FAILED")).toBeInTheDocument();
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("clears an old backend error when creation is retried", async () => {
		const user = userEvent.setup();
		createGameMock
			.mockRejectedValueOnce({
				response: { data: { error: { game: "ALREADY_IN_GAME" } } },
			})
			.mockResolvedValueOnce({ uid: "retry-room-uid" });

		render(<PCreateRoom />);

		await user.type(screen.getByLabelText(/game_name/i), "Retry room");
		await user.click(screen.getByRole("button", { name: /create_game/i }));
		expect(await screen.findByText("ALREADY_IN_GAME")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /create_game/i }));

		await waitFor(() => expect(screen.queryByText("ALREADY_IN_GAME")).not.toBeInTheDocument());
		expect(navigateMock).toHaveBeenCalledWith("/game/retry-room-uid");
	});
});
