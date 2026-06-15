import type { AlertColor } from "@mui/material";

export interface IEventStatus {
	valid: boolean;
	msg?: string;
	fieldErrors?: Record<string, string | string[]>;
	resetOnSuccess?: boolean;
}


export interface IAppNotif {
	severity: AlertColor,
	message: string,
}