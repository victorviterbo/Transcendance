import { useCallback, useMemo } from "react";
import { useBlocker, type BlockerFunction } from "react-router-dom";
import type { TGameSessionState } from "../../types/game";

export interface IGameLeaveGuard {
	blocked: boolean;
	stay: () => void;
	leave: () => void;
}

function useGameLeaveGuard(sessionState: TGameSessionState): IGameLeaveGuard {
	const shouldBlock = useCallback<BlockerFunction>(
		({ currentLocation, nextLocation }) => {
			if (sessionState != "joined") return false;
			return currentLocation.pathname !== nextLocation.pathname;
		},
		[sessionState],
	);
	const blocker = useBlocker(shouldBlock);

	return useMemo(
		() => ({
			blocked: blocker.state === "blocked",
			stay: () => {
				if (blocker.state === "blocked") blocker.reset();
			},
			leave: () => {
				if (blocker.state === "blocked") blocker.proceed();
			},
		}),
		[blocker],
	);
}

export default useGameLeaveGuard;
