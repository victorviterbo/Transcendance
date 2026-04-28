export function checkUsernameValid(username: string): string[] {
	const allowedRegex: RegExp = /^[A-Za-z0-9_-]+$/;
	const errmsg: string[] = [];
	const trimmedUsername = username.trim();
	if (trimmedUsername.length === 0) return errmsg;
	if (!allowedRegex.test(trimmedUsername)) errmsg.push("USERNAME_FORBIDDEN");
	if (trimmedUsername.toLowerCase() === "admin") errmsg.push("USERNAME_ADMIN");
	if (trimmedUsername.length < 3) errmsg.push("USERNAME_MIN");
	if (trimmedUsername.length > 20) errmsg.push("USERNAME_MAX");
	return errmsg;
}

export function checkEmailValid(email: string): string[] {
	const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const errmsg: string[] = [];
	if (email.length === 0) return errmsg;
	if (!emailRegex.test(email.trim())) errmsg.push("EMAIL_VALID");
	return errmsg;
}

export function checkPasswordValid(password: string): string[] {
	const numberRegex: RegExp = /(?=.*\d)/;
	const upperRegex: RegExp = /(?=.*[A-Z])/;
	const lowerRegex: RegExp = /(?=.*[a-z])/;
	const specialRegex: RegExp = /(?=.*[^A-Za-z0-9])/;
	const errmsg: string[] = [];
	if (password.length === 0) return errmsg;
	if (password.length < 8) errmsg.push("PASSWORD_MIN");
	if (!numberRegex.test(password)) errmsg.push("PASSWORD_NUMBER");
	if (!lowerRegex.test(password)) errmsg.push("PASSWORD_LOWERCASE");
	if (!upperRegex.test(password)) errmsg.push("PASSWORD_UPPERCASE");
	if (!specialRegex.test(password)) errmsg.push("PASSWORD_SPECIAL");
	return errmsg;
}
