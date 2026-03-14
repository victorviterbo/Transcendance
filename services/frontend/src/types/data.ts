export type TOption = {
	value: string;
	label: string;
};

export type TMenuOption = {
	label: string;
	value?: string;
	action?: (label: string | undefined) => void;
};
