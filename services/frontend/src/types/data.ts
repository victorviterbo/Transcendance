import type { ReactNode } from "react";

export type TOption = {
	value: string;
	label: string;
	icon?: ReactNode;
};

export type TMenuOption = {
	label: string;
	value?: string;
	action?: (label: string | undefined) => void;
};
