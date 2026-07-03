import { cloneElement, type ReactElement, type ReactNode } from "react";
import type { ILangContent, ILangData, ILocalizationData } from "../types/localizationTypes";

export const langData: ILocalizationData = {
	headers: [],
	langs: [],
	idPos: -1,
	descPos: -1,
	totalCol: -1,
};

export const LANGUAGE_STORAGE_KEY = "guess_tunes_language";

function normalizeLang(lang: string | null | undefined): string | null {
	if (!lang) return null;
	return lang.trim().toLowerCase().split("-")[0] || null;
}

function isLangAvailable(lang: string | null): lang is string {
	if (!lang) return false;
	return langData.langs.some((item: ILangData) => item.code === lang);
}

function readStoredLanguage(): string | null {
	if (typeof localStorage === "undefined") return null;
	try {
		return normalizeLang(localStorage.getItem(LANGUAGE_STORAGE_KEY));
	} catch {
		return null;
	}
}

function writeStoredLanguage(lang: string): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
	} catch {
		return;
	}
}

function readBrowserLanguage(): string | null {
	if (typeof navigator === "undefined") return null;
	const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
	for (const lang of langs) {
		const normalized = normalizeLang(lang);
		if (normalized) return normalized;
	}
	return null;
}

function applyDocumentLanguage(lang: string): void {
	if (typeof document === "undefined") return;
	document.documentElement.lang = lang;
}

export let currentLang: string = readStoredLanguage() ?? "en";

const NUMBER_FORMAT_LOCALES: Record<string, string> = {
	en: "en-US",
	fr: "fr-FR",
	ja: "ja-JP",
	de: "de-DE",
};

let onLangChangedBind: (() => void) | null = null;
export function onLangChanged(lang: string) {
	const nextLang = normalizeLang(lang);
	if (!isLangAvailable(nextLang)) return;
	currentLang = nextLang;
	writeStoredLanguage(nextLang);
	applyDocumentLanguage(nextLang);
	if (onLangChangedBind) onLangChangedBind();
}
export function setOnLangChanged(func: () => void): void {
	onLangChangedBind = func;
}

function splitLines(line: string): string[] {
	const data: string[] = [];
	let current: string = "";
	let isInQuotes: boolean = false;
	let isEscaping: boolean = false;

	for (let i: number = 0; i < line.length; i++) {
		if (line.charAt(i) == "," && !isInQuotes && !isEscaping) {
			data.push(current);
			current = "";
			continue;
		} else if (line.charAt(i) == '"' && !isEscaping) {
			isInQuotes = !isInQuotes;
			continue;
		} else if (line.charAt(i) == "\\" && !isEscaping) {
			isEscaping = true;
			continue;
		}

		if (isEscaping) isEscaping = false;
		current += line.charAt(i);
	}
	data.push(current);
	return data;
}

function prepData(): void {
	if (langData.headers.length < 3) throw Error("Invalid headers: at least 3 col are required");
	else if (
		!langData.headers.find((item: string) => {
			return item == "id";
		})
	)
		throw Error("Invalid headers: missing id");
	else if (
		!langData.headers.find((item: string) => {
			return item == "desc";
		})
	)
		throw Error("Invalid headers: missing desc");

	//Clean
	langData.headers.forEach((item: string, index: number) => {
		langData.headers[index] = item.replaceAll(" ", "");
	});

	langData.headers.forEach((item: string, index: number) => {
		if (item == "id") {
			langData.idPos = index;
			return;
		}
		if (item == "desc") {
			langData.descPos = index;
			return;
		}
		langData.langs.push({
			code: item,
			pos: index,
			content: [],
		});
	});

	langData.totalCol = langData.headers.length;
}

function applyContent(content: string[], lineID: number): void {
	if (langData.idPos == -1) throw Error("Invalid 'id' position.");
	if (content.length < langData.totalCol)
		throw Error("Invalid number of column at position: " + (lineID + 1));
	const currentId = content[langData.idPos];
	langData.langs.forEach((item: ILangData) => {
		item.content.push({
			id: currentId,
			data: content[item.pos],
		});
	});
}

function applyInitialLanguage(): void {
	const storedLang = readStoredLanguage();
	const browserLang = readBrowserLanguage();
	const preferredLang = [storedLang, browserLang, currentLang, "en"].find(isLangAvailable);

	currentLang = preferredLang ?? langData.langs[0]?.code ?? "en";
	applyDocumentLanguage(currentLang);
}

export async function startLocalization(): Promise<void> {
	await fetch("/localization/lang.csv", {
		method: "GET",
	})
		.then((reponse: Response) => {
			if (!reponse.ok) {
				return;
			}
			return reponse.text();
		})
		.then((text: string | undefined) => {
			if (!text) return;
			const linesRaw: string[] = text.split(/\r?\n/);
			if (linesRaw.length < 2) throw Error("No available localization data");

			langData.headers = splitLines(linesRaw[0]);
			linesRaw.splice(0, 1);

			prepData();

			linesRaw.forEach((line: string, index: number) => {
				if (line == "") return;
				applyContent(splitLines(line), index);
			});
			applyInitialLanguage();
		});
}

export function ttr(id: string): string {
	let finalData = id;
	langData.langs.forEach((lang: ILangData) => {
		if (lang.code != currentLang) return;
		lang.content.forEach((data: ILangContent) => {
			if (data.id == id) finalData = data.data;
		});
	});
	return finalData;
}

export function ttrf(id: string, params: Record<string, string>): string {
	let text = ttr(id);
	for (const [key, value] of Object.entries(params)) {
		text = text.replaceAll(`{${key}}`, String(value));
	}
	return text;
}

export function ttrfn(id: string, params: Record<string, ReactElement>): ReactNode[] {
	const text: string = ttr(id);
	const reg: RegExp = new RegExp(/([^{}]*)\{(.+?)\}([^{}]*)/gm);
	const out: ReactNode[] = [];

	let array: RegExpExecArray | null = null;
	while ((array = reg.exec(text)) !== null) {
		if (array.length != 4) continue;
		out.push(array[1]);
		out.push(
			cloneElement(params[array[2]], {
				key: array[2],
			}),
		);
		out.push(array[3]);
	}
	return out;
}

export function ttrn(value: number, options?: Intl.NumberFormatOptions): string {
	const locale = NUMBER_FORMAT_LOCALES[currentLang] ?? NUMBER_FORMAT_LOCALES.en;
	return new Intl.NumberFormat(locale, options).format(value);
}

export function ttrd(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
	const locale = NUMBER_FORMAT_LOCALES[currentLang] ?? NUMBER_FORMAT_LOCALES.en;
	const date = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat(locale, options).format(date);
}
