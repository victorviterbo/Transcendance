import axios from "axios";
import type { ReactNode } from "react";
import CText from "../components/text/CText";
import type { IError, IErrorOptions, IErrorStruct } from "../types/error.ts";
import { Stack } from "@mui/material";

export const getErrorNode = (
	error: unknown,
	fallback: string,
	options?: IErrorOptions,
): ReactNode => {
	function getComponent(children: ReactNode | string, key?: string) {
		return (
			<CText
				size={options?.size}
				key={key}
				align="center"
				sx={
					options?.sx
						? [
								{ color: "red" },
								...(Array.isArray(options) ? options : options ? [options] : []),
							]
						: { color: "red" }
				}
			>
				{children}
			</CText>
		);
	}

	let finalError: IErrorStruct | undefined = undefined;
	if (axios.isAxiosError(error)) {
		finalError = error.response?.data?.error;
		if (!finalError) return getComponent(fallback);
	} else if (error && typeof error == "object") {
		finalError = error as IErrorStruct;
	}

	if (
		finalError &&
		typeof finalError == "object" &&
		finalError.default &&
		Array.isArray(finalError.default) &&
		finalError.default.length > 0
	)
		return (
			<Stack>
				{finalError.default.map((value: IError, index: number) => {
					return getComponent(value.code, "Error" + index);
				})}
			</Stack>
		);
	return getComponent(fallback);
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (typeof error === "object" && error !== null) {
		const maybe = error as {
			response?: { data?: { error?: string | Record<string, string> } };
		};
		const payload = maybe.response?.data?.error;
		if (typeof payload === "string") {
			return payload;
		}
		if (payload && typeof payload === "object") {
			const messages = Object.values(payload).filter(Boolean);
			if (messages.length > 0) {
				return messages.join(", ");
			}
		}
		return fallback;
	}
	return fallback;
};
