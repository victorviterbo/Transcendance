const debugValue = import.meta.env.VITE_DEBUG?.trim().toLowerCase();
const debugEnabled = debugValue === "1" || debugValue === "true";

export function debugLog(...args: unknown[]): void {
	if (debugEnabled) console.log(...args);
}

export function debugWarn(...args: unknown[]): void {
	if (debugEnabled) console.warn(...args);
}

export function debugError(...args: unknown[]): void {
	if (debugEnabled) console.error(...args);
}
