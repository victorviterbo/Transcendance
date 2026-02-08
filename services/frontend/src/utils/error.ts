export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (typeof error === "object" && error !== null) {
		const maybe = error as { response?: { data?: { error?: string } } };
		return maybe.response?.data?.error ?? fallback;
	}
	return fallback;
};
