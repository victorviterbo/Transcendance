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

export type IErrorStruct = Record<string, IError[]> | Record<string, string>;

export interface IErrorOptions {
	size?: TSize;
	sx?: SxProps<Theme>;
}
