export function checkPasswordValid(data: string): string | null {
	if (data.length > 0 && data.length < 8)
		return "Invlid size: must contain at least 8 characters";
	return null;
}
