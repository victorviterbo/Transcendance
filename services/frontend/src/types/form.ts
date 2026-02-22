import type { TextFieldProps } from "@mui/material";

export type TValidator = (value: string, values: Record<string, string>) => string[];

export type TConfirmConfig = {
	name?: string;
	label?: string;
	error?: string;
	required?: boolean;
};

export type TFormFieldConfig = {
	name: string;
	label: string;
	type?: TextFieldProps["type"];
	required?: boolean;
	validate?: TValidator;
	confirm?: boolean | TConfirmConfig;
	initialValue?: string;
};
