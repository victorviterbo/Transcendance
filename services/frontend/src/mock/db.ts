import {
	DEFAULT_PROFILE_AVATAR,
	defaultMatchHistories,
	defaultStatsProfiles,
	defaultUsers,
	mockBadgeBreakpoints,
	mockBadgeStrings,
} from "./db.data";

export interface MockUser {
	username: string;
	email: string;
	password: string;
	avatar: string | null;
	expPoints: number;
	isGuest?: boolean;
	sessionKey?: string | null;
}

export interface MockGlobalStatsProfile {
	averageScore: number;
	averageTime: number;
	successRateArtist: number;
	successRateSong: number;
	successRateComplete: number;
	successRatesCompleteByTag: Record<string, number>;
}

export interface MockHistoryPlayerSeed {
	username: string;
	ranking: number;
	avatar?: string | null;
}

export interface MockHistoryRound {
	trackName: string;
	trackArtist: string;
	songFound: boolean;
	artistFound: boolean;
	time: number;
	ranking: number;
	previewUrl: string;
	artworkUrl: string;
	roundNumber: number;
}

export interface MockHistoryEntrySeed {
	playedAt: string;
	xpEarned: number;
	ranking: number;
	roomTitle: string;
	tags: string[];
	players: MockHistoryPlayerSeed[];
	rounds: MockHistoryRound[];
}

export interface MockHistoryPlayer {
	username: string;
	avatar: string;
	ranking: number;
}

export interface MockHistoryEntry {
	playedAt: string;
	xpEarned: number;
	ranking: number;
	roomTitle: string;
	tags: string[];
	players: MockHistoryPlayer[];
	rounds: MockHistoryRound[];
}

export interface MockGlobalStatsResponse extends MockGlobalStatsProfile {
	xp: number;
	ranking: number;
	totalPlayers: number;
}

export interface MockLeaderboardEntry {
	username: string;
	avatar: string;
	xp: number;
	badges: string;
	ranking: number;
	isCurrentUser: boolean;
}

export interface MockLeaderboardResponse {
	leaderboard: MockLeaderboardEntry[];
	leaderboardCount: number;
	ranking: number;
	totalNumberPlayer: number;
}

export interface MockHistoryResponse {
	history: MockHistoryEntry[];
	historyCount: number;
}

export { DEFAULT_PROFILE_AVATAR, mockBadgeStrings } from "./db.data";

const LEADERBOARD_LIMIT = 10;

export const getBadgeForXp = (xp: number) => {
	const safeXp = Math.max(0, Math.floor(xp));
	const badgeIndex = mockBadgeBreakpoints.findIndex((breakpoint) => safeXp < breakpoint);
	return badgeIndex === -1
		? mockBadgeStrings[mockBadgeStrings.length - 1]
		: mockBadgeStrings[badgeIndex];
};

const createGlobalStatsProfile = (
	overrides: Partial<MockGlobalStatsProfile> = {},
): MockGlobalStatsProfile => {
	const { successRatesCompleteByTag, ...rest } = overrides;

	return {
		averageScore: 0,
		averageTime: 0,
		successRateArtist: 0,
		successRateSong: 0,
		successRateComplete: 0,
		...rest,
		successRatesCompleteByTag: {
			TAG_POP: 0,
			TAG_ROCK: 0,
			TAG_ELECTRO: 0,
			...successRatesCompleteByTag,
		},
	};
};

const cloneGlobalStatsProfile = (profile: Partial<MockGlobalStatsProfile>) =>
	createGlobalStatsProfile(profile);

const cloneHistoryRound = (round: MockHistoryRound): MockHistoryRound => ({ ...round });

const cloneHistoryPlayerSeed = (player: MockHistoryPlayerSeed): MockHistoryPlayerSeed => ({
	...player,
});

const cloneHistoryEntrySeed = (entry: MockHistoryEntrySeed): MockHistoryEntrySeed => ({
	playedAt: entry.playedAt,
	xpEarned: entry.xpEarned,
	ranking: entry.ranking,
	roomTitle: entry.roomTitle,
	tags: [...entry.tags],
	players: entry.players.map(cloneHistoryPlayerSeed),
	rounds: entry.rounds.map(cloneHistoryRound),
});

const cloneUser = (user: MockUser): MockUser => ({ ...user });

const cloneStatsProfileMap = (profiles: Record<string, Partial<MockGlobalStatsProfile>>) =>
	Object.fromEntries(
		Object.entries(profiles).map(([username, profile]) => [
			username,
			cloneGlobalStatsProfile(profile),
		]),
	);

const cloneHistoryMap = (historyMap: Record<string, MockHistoryEntrySeed[]>) =>
	Object.fromEntries(
		Object.entries(historyMap).map(([username, history]) => [
			username,
			history.map(cloneHistoryEntrySeed),
		]),
	);

let users: MockUser[] = [];
let sessionUser: string | null = null;
let globalStatsProfiles: Record<string, MockGlobalStatsProfile> = {};
let matchHistories: Record<string, MockHistoryEntrySeed[]> = {};

/**
 * @brief Normalize email for comparisons.
 * @param value Raw email input.
 * @returns Normalized lowercase email without surrounding whitespace.
 */
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

/**
 * @brief Normalize username for comparisons.
 * @param value Raw username input.
 * @returns Normalized username without surrounding whitespace.
 */
export const normalizeUsername = (value: string) => value.trim();

const ensureStatsProfile = (username: string) => {
	if (!globalStatsProfiles[username]) {
		globalStatsProfiles[username] = createGlobalStatsProfile();
	}
	return globalStatsProfiles[username];
};

const ensureHistory = (username: string) => {
	if (!matchHistories[username]) {
		matchHistories[username] = [];
	}
	return matchHistories[username];
};

const ensureStatsState = (username: string) => {
	ensureStatsProfile(username);
	ensureHistory(username);
};

const listRankedUsers = () =>
	listUsers().sort(
		(left, right) =>
			right.expPoints - left.expPoints || left.username.localeCompare(right.username),
	);

const getRankPosition = (username: string) => {
	const rankedUsers = listRankedUsers();
	const position = rankedUsers.findIndex((user) => user.username === username);

	return {
		ranking: position >= 0 ? position + 1 : rankedUsers.length + 1,
		totalPlayers: rankedUsers.length,
	};
};

const resolveAvatar = (avatar: string | null | undefined) => avatar ?? DEFAULT_PROFILE_AVATAR;

const resolveHistoryPlayerAvatar = (player: MockHistoryPlayerSeed) =>
	resolveAvatar(player.avatar ?? findUserByExactUsername(player.username)?.avatar);

const renameHistoryParticipants = (currentUsername: string, nextUsername: string) => {
	for (const history of Object.values(matchHistories)) {
		for (const entry of history) {
			for (const player of entry.players) {
				if (player.username === currentUsername) {
					player.username = nextUsername;
				}
			}
		}
	}
};

const moveStatsState = (currentUsername: string, nextUsername: string) => {
	if (currentUsername === nextUsername) return;

	globalStatsProfiles[nextUsername] = cloneGlobalStatsProfile(
		globalStatsProfiles[currentUsername] ?? createGlobalStatsProfile(),
	);
	delete globalStatsProfiles[currentUsername];

	matchHistories[nextUsername] = (matchHistories[currentUsername] ?? []).map(
		cloneHistoryEntrySeed,
	);
	delete matchHistories[currentUsername];

	renameHistoryParticipants(currentUsername, nextUsername);
};

/**
 * @brief Reset the mock database to the default state.
 * @returns void
 */
export const resetMockDb = () => {
	users = defaultUsers.map(cloneUser);
	sessionUser = null;
	globalStatsProfiles = cloneStatsProfileMap(defaultStatsProfiles);
	matchHistories = cloneHistoryMap(defaultMatchHistories);

	for (const user of users) {
		ensureStatsState(user.username);
	}
};

/**
 * @brief Find a user by email (normalized).
 * @param email Email to search for.
 * @returns The matched user or null if not found.
 */
export const findUserByEmail = (email: string) =>
	users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;

/**
 * @brief Find a user by username (normalized).
 * @param username Username to search for.
 * @returns The matched user or null if not found.
 */
export const findUserByUsername = (username: string) =>
	users.find((user) => normalizeUsername(user.username) === normalizeUsername(username)) ?? null;

export const findUserByExactUsername = (username: string) =>
	users.find((user) => user.username === username) ?? null;

/**
 * @brief Create a new user in the mock database.
 * @param username New user's username.
 * @param email New user's email.
 * @param password New user's password.
 * @returns The created user record.
 */
export const createUser = (username: string, email: string, password: string) => {
	const newUser: MockUser = {
		username: normalizeUsername(username),
		email: normalizeEmail(email),
		password,
		avatar: null,
		expPoints: 0,
		isGuest: false,
		sessionKey: null,
	};
	users.push(newUser);
	ensureStatsState(newUser.username);
	return newUser;
};

export const listUsers = () => users.map(cloneUser);

/**
 * @brief Validate credentials against the mock database.
 * @param email Email to authenticate.
 * @param password Password to authenticate.
 * @returns The matched user or null if credentials are invalid.
 */
export const authenticate = (email: string, password: string) => {
	const user = findUserByEmail(email);
	if (!user) return null;
	return user.password === password ? user : null;
};

/**
 * @brief Get the currently mocked authenticated user.
 * @returns The active user or null if none.
 */
export const getSessionUser = () => {
	if (sessionUser) return findUserByUsername(sessionUser);
	return null;
};

/**
 * @brief Set the mocked authenticated username.
 * @param username Current username or null.
 */
export const setSessionUser = (username: string | null) => {
	sessionUser = username ? normalizeUsername(username) : null;
};

export const clearSessionUser = () => {
	sessionUser = null;
};

/**
 * @brief Update a user profile with partial fields.
 * @param username Username that is being modified.
 * @param updates Profile fields to update.
 * @returns Updated user or null if user does not exist.
 */
export const updateUser = (
	username: string,
	updates: Partial<Pick<MockUser, "username" | "email" | "avatar">>,
) => {
	const normalizedTarget = normalizeUsername(username);
	const index = users.findIndex((user) => normalizeUsername(user.username) === normalizedTarget);
	if (index < 0) return null;

	const current = users[index];
	const next: MockUser = { ...current };

	if (updates.username && normalizeUsername(updates.username) !== current.username) {
		const conflict = findUserByUsername(updates.username);
		if (conflict) return null;
		next.username = normalizeUsername(updates.username);
	}
	if (updates.email) next.email = normalizeEmail(updates.email);
	if (typeof updates.avatar !== "undefined") next.avatar = updates.avatar;

	users[index] = next;
	moveStatsState(current.username, next.username);

	if (sessionUser === current.username) {
		sessionUser = next.username;
	}
	return next;
};

/**
 * @brief Update a user's password if the current password matches.
 * @param username Username being modified.
 * @param currentPassword Current password to verify.
 * @param newPassword Replacement password.
 * @returns Updated user or null if the user does not exist or the password is wrong.
 */
export const updatePassword = (username: string, currentPassword: string, newPassword: string) => {
	const normalizedTarget = normalizeUsername(username);
	const index = users.findIndex((user) => normalizeUsername(user.username) === normalizedTarget);
	if (index < 0) return null;
	if (users[index].password !== currentPassword) return null;

	users[index] = {
		...users[index],
		password: newPassword,
	};
	return users[index];
};

export const setUserExpPoints = (username: string, expPoints: number) => {
	const normalizedTarget = normalizeUsername(username);
	const index = users.findIndex((user) => normalizeUsername(user.username) === normalizedTarget);
	if (index < 0) return null;

	users[index] = {
		...users[index],
		expPoints: Math.max(0, Math.floor(expPoints)),
	};
	return users[index];
};

export const setUserStatsProfile = (
	username: string,
	overrides: Partial<MockGlobalStatsProfile>,
) => {
	const user = findUserByUsername(username);
	if (!user) return null;

	const currentProfile = ensureStatsProfile(user.username);
	const nextProfile = createGlobalStatsProfile({
		...currentProfile,
		...overrides,
		successRatesCompleteByTag: {
			...currentProfile.successRatesCompleteByTag,
			...overrides.successRatesCompleteByTag,
		},
	});

	globalStatsProfiles[user.username] = nextProfile;
	return cloneGlobalStatsProfile(nextProfile);
};

export const setUserHistory = (username: string, history: MockHistoryEntrySeed[]) => {
	const user = findUserByUsername(username);
	if (!user) return null;

	matchHistories[user.username] = history.map(cloneHistoryEntrySeed);
	return matchHistories[user.username].map(cloneHistoryEntrySeed);
};

export const getGlobalStats = (username: string): MockGlobalStatsResponse | null => {
	const user = findUserByExactUsername(username);
	if (!user) return null;

	const profile = ensureStatsProfile(user.username);
	const { ranking, totalPlayers } = getRankPosition(user.username);

	return {
		...cloneGlobalStatsProfile(profile),
		xp: user.expPoints,
		ranking,
		totalPlayers,
	};
};

export const getLeaderboard = (currentUsername: string): MockLeaderboardResponse => {
	const rankedUsers = listRankedUsers();
	const { ranking } = getRankPosition(currentUsername);
	const leaderboard = rankedUsers.slice(0, LEADERBOARD_LIMIT).map((user, index) => ({
		username: user.username,
		avatar: resolveAvatar(user.avatar),
		xp: user.expPoints,
		badges: getBadgeForXp(user.expPoints),
		ranking: index + 1,
		isCurrentUser: user.username === currentUsername,
	}));

	if (ranking > LEADERBOARD_LIMIT) {
		const currentUser = rankedUsers[ranking - 1];
		if (currentUser) {
			leaderboard.push({
				username: currentUser.username,
				avatar: resolveAvatar(currentUser.avatar),
				xp: currentUser.expPoints,
				badges: getBadgeForXp(currentUser.expPoints),
				ranking,
				isCurrentUser: true,
			});
		}
	}

	return {
		leaderboard,
		leaderboardCount: leaderboard.length,
		ranking,
		totalNumberPlayer: rankedUsers.length,
	};
};

export const getHistory = (username: string): MockHistoryResponse | null => {
	const user = findUserByExactUsername(username);
	if (!user) return null;

	const history = ensureHistory(user.username).map((entry) => ({
		playedAt: entry.playedAt,
		xpEarned: entry.xpEarned,
		ranking: entry.ranking,
		roomTitle: entry.roomTitle,
		tags: [...entry.tags],
		players: entry.players.map((player) => ({
			username: player.username,
			avatar: resolveHistoryPlayerAvatar(player),
			ranking: player.ranking,
		})),
		rounds: entry.rounds.map(cloneHistoryRound),
	}));

	return {
		history,
		historyCount: history.length,
	};
};

/**
 * @brief Delete user profile and reset session when needed.
 * @param username User identifier.
 * @returns true when deleted.
 */
export const deleteUser = (username: string) => {
	const normalized = normalizeUsername(username);
	const index = users.findIndex((user) => normalizeUsername(user.username) === normalized);
	if (index < 0) return false;

	const [deletedUser] = users.splice(index, 1);
	delete globalStatsProfiles[deletedUser.username];
	delete matchHistories[deletedUser.username];

	if (sessionUser && normalizeUsername(sessionUser) === normalized) sessionUser = null;
	return true;
};

resetMockDb();

export const db = {
	findUserByEmail,
	findUserByUsername,
	findUserByExactUsername,
	createUser,
	listUsers,
	authenticate,
	getSessionUser,
	setSessionUser,
	clearSessionUser,
	updateUser,
	updatePassword,
	setUserExpPoints,
	setUserStatsProfile,
	setUserHistory,
	getGlobalStats,
	getLeaderboard,
	getHistory,
	deleteUser,
};
