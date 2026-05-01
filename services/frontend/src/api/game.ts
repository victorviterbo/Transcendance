import type { AxiosResponse } from "axios";
import type { IErrorStruct } from "../types/error";
import api from "./client";
import type { ReactNode } from "react";
import { getErrorNode } from "../utils/error";

export function gameGetRoom(): string | undefined {
	const reg = /game\/(\d+)/gm;
	const res = reg.exec(location.href);
	if (!res || res.length < 2) return undefined;
	return res[1];
}

export function gameCheckErrors<_RES_T extends { error?: IErrorStruct }, Key extends keyof _RES_T>(
	res: AxiosResponse<_RES_T, unknown, {}>,
	target: Key,
) {
	if (!res || !res.data)
		throw { error: { default: [{ message: "No response", code: "NO_RESPONSE" }] } };
	if (res.data.error) throw res.data.error;
	if (typeof res.data != "object" || !(target in res.data))
		throw { error: { default: [{ message: "Invalid object", code: "INVALID" }] } };
}

export async function gameFetchData<
	_DATA,
	_RES_T extends { error?: IErrorStruct },
	Key extends keyof _RES_T,
>(
	Request: string,
	target: Key,
	setTarget: React.Dispatch<React.SetStateAction<_DATA>>,
	setError: React.Dispatch<React.SetStateAction<ReactNode>>,
	defaultValue: _DATA,
	fallbackMSG: string,
) {
	try {
		const response = await api.get<_RES_T>(Request);
		gameCheckErrors(response, target);
		setTarget(response.data[target] as _DATA);
		setError(undefined);
	} catch (error) {
		setError(getErrorNode(error, fallbackMSG));
		setTarget(defaultValue);
	}
}
