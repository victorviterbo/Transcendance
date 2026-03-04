import type { CSSObject } from "@mui/material";

export const ARotation: Record<string, CSSObject> = {
	from: { transform: "rotate(0deg)" },
	to: { transform: "rotate(360deg)" },
};

export function makeMaskTranslationAnim(size: string | number): Record<string, CSSObject> {
	return {
		from: {
			WebkitMaskPosition: "0 0",
			maskPosition: "0 0",
		},
		to: {
			WebkitMaskPosition: (typeof size == "string" ? size : size + "px") + " " + (typeof size == "string" ? size : size + "px"),
			maskPosition: (typeof size == "string" ? size : size + "px") + " " + (typeof size == "string" ? size : size + "px"),
		},
	};
}

export function makeTranslationAnim(): Record<string, CSSObject> {
	return {
		from: { transform: "translateX(0%)" },
		to: { transform: "translateX(100%)" },
	};
}
