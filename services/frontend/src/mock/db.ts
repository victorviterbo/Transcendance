export interface MockUser {
	username: string;
	email: string;
	password: string;
}

const defaultUser: MockUser = {
	username: "john",
	email: "john@42.fr",
	password: "secret",
};

let users: MockUser[] = [];

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
	users = [{ ...defaultUser }];
};

/**
 * @brief Find a user by email (normalized).
 * @param email Email to search for.
 * @returns The matched user or null if not found.
 */
const findUserByEmail = (email: string) =>
	users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;

/**
 * @brief Find a user by username (normalized).
 * @param username Username to search for.
 * @returns The matched user or null if not found.
 */
const findUserByUsername = (username: string) =>
	users.find((user) => normalizeUsername(user.username) === normalizeUsername(username)) ?? null;

/**
 * @brief Create a new user in the mock database.
 * @param username New user's username.
 * @param email New user's email.
 * @param password New user's password.
 * @returns The created user record.
 */
const createUser = (username: string, email: string, password: string) => {
	const newUser: MockUser = {
		username: normalizeUsername(username),
		email: normalizeEmail(email),
		password,
	};
	users.push(newUser);
	return newUser;
};

/**
 * @brief Validate credentials against the mock database.
 * @param email Email to authenticate.
 * @param password Password to authenticate.
 * @returns The matched user or null if credentials are invalid.
 */
const authenticate = (email: string, password: string) => {
	const user = findUserByEmail(email);
	if (!user) return null;
	return user.password === password ? user : null;
};

resetMockDb();

export const db = {
	findUserByEmail,
	findUserByUsername,
	createUser,
	authenticate,
};
