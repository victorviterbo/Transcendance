export async function getErrorMessage(response: Response, fallback: string): Promise<string> {
	try {
		const data = (await response.json()) as {
			error?: string;
			errors?: Record<string, string>;
		};
		if (data.error) {
			return data.error;
		}
		if (data.errors) {
			const messages = Object.values(data.errors).filter(Boolean);
			if (messages.length > 0) {
				return messages.join(", ");
			}
		}
		return fallback;
	} catch {
		return fallback;
	}
}
