export function checkUsernameValid(username: string): string[] {
	const errmsg: string[] = [];
	if (username.trim().length > 20) errmsg.push("Username at most 20 characters");
	return errmsg;
}

export function checkEmailValid(email: string): string[] {
	const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const errmsg: string[] = [];
	if (email.length === 0) return errmsg;
	if (!emailRegex.test(email.trim())) errmsg.push("Enter a valid email address.");
	return errmsg;
}

export function checkPasswordValid(password: string): string[] {
	const numberRegex: RegExp = /(?=.*\d)/;
	const upperRegex: RegExp = /(?=.*[A-Z])/;
	const lowerRegex: RegExp = /(?=.*[a-z])/;
	const specialRegex: RegExp = /(?=.*[^A-Za-z0-9])/;
	const errmsg: string[] = [];
	if (password.length === 0) return errmsg;
	if (password.length < 8) errmsg.push("Use at least 8 characters.");
	if (!numberRegex.test(password)) errmsg.push("Include at least 1 number.");
	if (!lowerRegex.test(password)) errmsg.push("Include at least 1 lowercase letter.");
	if (!upperRegex.test(password)) errmsg.push("Include at least 1 uppercase letter.");
	if (!specialRegex.test(password)) errmsg.push("Include at least 1 special character.");
	return errmsg;
}

export function checkConfirmPasswordValid(password: string, confirm: string): string[] {
	const errmsg: string[] = [];
	if (confirm.length === 0 || password === confirm) return errmsg;
	errmsg.push("Passwords do not match");
	return errmsg;
}
