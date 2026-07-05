import type { ILangData, ILocalizationData } from "../types/localizationTypes";
import { LANGUAGE_STORAGE_KEY } from "../constants";

//--------------------------------------------------
//                    UTIL
//--------------------------------------------------
function normalizeLang(lang: string | null | undefined): string | null {
	if (!lang) return null;
	return lang.trim().toLowerCase().split("-")[0] || null;
}

export function writeStoredLanguage(lang: string): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
	} catch {
		return;
	}
}

//--------------------------------------------------
//                  INIT
//--------------------------------------------------
function isLangAvailable(langData: ILocalizationData, lang: string | null): lang is string {
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

function readBrowserLanguage(): string | null {
	if (typeof navigator === "undefined") return null;
	const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
	for (const lang of langs) {
		const normalized = normalizeLang(lang);
		if (normalized) return normalized;
	}
	return null;
}

export function getLanguage(langData?: ILocalizationData): string {
	const storedLang = readStoredLanguage();
	const browserLang = readBrowserLanguage();
	if (!langData || langData.headers.length == 0 || langData.langs.length == 0)
		return storedLang ?? browserLang ?? "en";
	const preferredLang = [storedLang, browserLang, "en"].find((Lang) => {
		if (!langData) return false;
		return isLangAvailable(langData, Lang);
	});

	return preferredLang ?? langData?.langs[0]?.code ?? "en";
}

//--------------------------------------------------
//                  BUILDER
//--------------------------------------------------
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

function prepData(langData: ILocalizationData): void {
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

function applyContent(langData: ILocalizationData, content: string[], lineID: number): void {
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

export async function getLocalization(): Promise<ILocalizationData> {
	return await fetch("/localization/lang.csv", {
		method: "GET",
	})
		.then((reponse: Response) => {
			if (!reponse.ok) {
				return;
			}
			return reponse.text();
		})
		.then((text: string | undefined): ILocalizationData => {
			const langData: ILocalizationData = {
				headers: [],
				langs: [],
				idPos: -1,
				descPos: -1,
				totalCol: -1,
			};
			if (!text) return langData;
			const linesRaw: string[] = text.split(/\r?\n/);
			if (linesRaw.length < 2) throw Error("No available localization data");

			langData.headers = splitLines(linesRaw[0]);
			linesRaw.splice(0, 1);

			prepData(langData);

			linesRaw.forEach((line: string, index: number) => {
				if (line == "") return;
				applyContent(langData, splitLines(line), index);
			});
			return langData;
		})
		.catch(() => {
			return {
				headers: [],
				langs: [],
				idPos: -1,
				descPos: -1,
				totalCol: -1,
			};
		});
}
