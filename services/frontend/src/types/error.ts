import type { SxProps, Theme } from "@mui/material";
import type { TSize } from "./string";

export interface IErrorReturn {
	error?: IErrorStruct;
	status?: number;
}

export interface IError {
	message: string;
	code: string;
}

export interface IErrorStruct {
	[key: string]: IError[];
}

export interface IErrorOptions {
	size?: TSize;
	sx?: SxProps<Theme>;
}
