import type { ReactElement, ReactNode } from "react";

export interface ILangContent {
	id: string;
	data: string;
}

export interface ILangData {
	code: string;
	pos: number;
	content: ILangContent[];
}

export interface ILocalizationData {
	headers: string[];
	langs: ILangData[];
	idPos: number;
	descPos: number;
	totalCol: number;
}

export interface ILangContext {
	currentLang: string;
	ttr: (id: string) => string;
	ttrf: (id: string, params: Record<string, string>) => string;
	ttrfn: (id: string, params: Record<string, ReactElement>) => ReactNode[];
	ttrn: (value: number, options?: Intl.NumberFormatOptions) => string;
	ttrd: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}
