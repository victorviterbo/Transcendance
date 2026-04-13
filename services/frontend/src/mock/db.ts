export interface MockUser {
	username: string;
	email: string;
	password: string;
	avatar: string | null;
	expPoints: number;
	isGuest?: boolean;
	sessionKey?: string | null;
}

export const mockBadgeStrings = [
	"Deaf Octopus",
	"Dazed Jellyfish",
	"Distracted Pigeon",
	"Curious Cat",
	"Attentive Owl",
	"Rhythmic Raptor",
	"Sonic Shark",
	"Echolocating Bat",
] as const;

const mockBadgeBreakpoints = [100, 200, 500, 1000, 2000, 5000, 10000] as const;

export const getBadgeForXp = (xp: number) => {
	const safeXp = Math.max(0, Math.floor(xp));
	const badgeIndex = mockBadgeBreakpoints.findIndex((breakpoint) => safeXp < breakpoint);
	return badgeIndex === -1
		? mockBadgeStrings[mockBadgeStrings.length - 1]
		: mockBadgeStrings[badgeIndex];
};

const defaultUsers: MockUser[] = [
	{
		username: "john",
		email: "john@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 120,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "luna",
		email: "luna@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 980,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "orion",
		email: "orion@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 860,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "nina",
		email: "nina@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 740,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "soren",
		email: "soren@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 690,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "iris",
		email: "iris@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 640,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "diego",
		email: "diego@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 590,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "mika",
		email: "mika@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 520,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "zoya",
		email: "zoya@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 460,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "kai",
		email: "kai@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 390,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "theo",
		email: "theo@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 310,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "ines",
		email: "ines@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 260,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "yara",
		email: "yara@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 210,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "pavel",
		email: "pavel@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 170,
		isGuest: false,
		sessionKey: null,
	},
	{
		username: "enzo",
		email: "enzo@42.fr",
		password: "secret",
		avatar: null,
		expPoints: 95,
		isGuest: false,
		sessionKey: null,
	},
];

let users: MockUser[] = [];
let sessionUser: string | null = null;

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

/**
 * @brief Reset the mock database to the default state.
 * @returns void
 */
export const resetMockDb = () => {
	users = defaultUsers.map((user) => ({ ...user }));
	sessionUser = null;
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
	return newUser;
};

export const listUsers = () => users.map((user) => ({ ...user }));

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

/**
 * @brief Delete user profile and reset session when needed.
 * @param username User identifier.
 * @returns true when deleted.
 */
export const deleteUser = (username: string) => {
	const normalized = normalizeUsername(username);
	const index = users.findIndex((user) => normalizeUsername(user.username) === normalized);
	if (index < 0) return false;
	users.splice(index, 1);
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
	deleteUser,
};
