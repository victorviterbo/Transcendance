export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (typeof error === "object" && error !== null) {
		const maybe = error as {
			response?: { data?: { error?: string | Record<string, string> } };
		};
		const payload = maybe.response?.data?.error;
		if (typeof payload === "string") {
			return payload;
		}
		if (payload && typeof payload === "object") {
			const messages = Object.values(payload).filter(Boolean);
			if (messages.length > 0) {
				return messages.join(", ");
			}
		}
		return fallback;
	}
	return fallback;
};
