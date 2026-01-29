export function checkPasswordValid(password: string): string[] | null {
	const numberRegex: RegExp = /(?=.*\d)/;
	const upperRegex: RegExp = /(?=.*[A-Z])/;
	const lowerRegex: RegExp = /(?=.*[a-z])/;
	const specialRegex: RegExp = /(?=.*[^A-Za-z0-9])/;
	const errmsg: string[] = [];
	if (password.length <= 0) return null;
	if (password.length < 8) errmsg.push("Use at least 8 characters.");
	if (!numberRegex.test(password)) errmsg.push("Include at least 1 number.");
	if (!lowerRegex.test(password)) errmsg.push("Include at least 1 lowercase letter.");
	if (!upperRegex.test(password)) errmsg.push("Include at least 1 uppercase letter.");
	if (!specialRegex.test(password)) errmsg.push("Include at least 1 special character.");
	return errmsg.length === 0 ? null : errmsg;
}
