export interface IError {
	message: string;
	code: string;
}

export interface IErrorStruct {
	[key: string]: IError[];
}
