import type { ILangContent, ILangData, ILocalizationData } from "../types/localizationTypes";

export const langData: ILocalizationData = {
	headers: [],
	langs: [],
	idPos: -1,
	descPos: -1,
	totalCol: -1,
};
export let currentLang: string = "en";

let onLangChangedBind: (() => void) | null = null;
export function onLangChanged(lang: string) {
	currentLang = lang;
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

export async function startLocalization(): Promise<void> {
	await fetch("localization/lang.csv", {
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
			const linesRaw: string[] = text.split("\r\n");
			if (linesRaw.length < 2) throw Error("No available localization data");

			langData.headers = splitLines(linesRaw[0]);
			linesRaw.splice(0, 1);

			prepData();

			linesRaw.forEach((line: string, index: number) => {
				if (line == "") return;
				applyContent(splitLines(line), index);
			});
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
