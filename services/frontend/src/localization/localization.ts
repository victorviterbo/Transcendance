import type { ILangContent, ILangData, ILocalizationData } from "../types/localizationTypes";

export var tr_langData: ILocalizationData = {
	headers: [],
	langs: [],
	idPos: -1,
	descPos: -1,
	totalCol: -1,
}
export var tr_currentLang: string = "en";

var tr_onLangChangedBind: (() => void) | null = null
export function tr_onLangChanged(lang: string)
{
	tr_currentLang = lang;
	if(tr_onLangChangedBind)
		tr_onLangChangedBind();
}
export function tr_setOnLangChanged(func: () => void): void {
	tr_onLangChangedBind = func;
}

function splitLines(line: string): string[] {
	var data: string[] = [];
	var current: string = "";
	var isInQuotes: boolean = false;
	var isEscaping: boolean = false;


	for(var i: number = 0; i < line.length; i++)
	{
		if(line.charAt(i) == "," && !isInQuotes && !isEscaping)
		{
			data.push(current);
			current = "";
			continue;
		}
		else if(line.charAt(i) == "\"" && !isEscaping)
		{
			isInQuotes = !isInQuotes;
			continue;
		}
		else if(line.charAt(i) == "\\" && !isEscaping)
		{
			isEscaping = true;
			continue;
		}

		if(isEscaping)
			isEscaping = false;
		current += line.charAt(i);
	}
	data.push(current);
	return data;
}

function prepData(): void {
	
	if(tr_langData.headers.length < 3)
		throw Error("Invalid headers: at least 3 col are required");
	else if(!tr_langData.headers.find((item: string) => { return item == "id"}))
		throw Error("Invalid headers: missing id");
	else if(!tr_langData.headers.find((item: string) => { return item == "desc"}))
		throw Error("Invalid headers: missing desc");
		 
	//Clean
	tr_langData.headers.forEach((item: string, index: number) => {
		tr_langData.headers[index] = item.replaceAll(" ", "")
	})
	
	tr_langData.headers.forEach((item: string, index: number) => {
		if(item == "id")
		{
			tr_langData.idPos = index;
			return;
		}
		if(item == "desc")
		{
			tr_langData.descPos = index;
			return;
		}
		tr_langData.langs.push({
			code: item,
			pos: index,
			content: [],
		});
	})

	tr_langData.totalCol = tr_langData.headers.length;
}

function applyContent(content: string[], lineID: number): void {

	if(tr_langData.idPos == -1)
		throw Error("Invalid 'id' position.");
	if(content.length < tr_langData.totalCol)
		throw Error("Invalid number of column at position: " + (lineID + 1));
	var currentId = content[tr_langData.idPos];
	tr_langData.langs.forEach((item: ILangData) => {
		item.content.push({
			id: currentId,
			data: content[item.pos]
		})
	})
}

export async function startLocalization(): Promise<void>  {
	await fetch("localization/lang.csv", {
		method: "GET",
	}).then((reponse: Response) => {
		if (!reponse.ok) {
			return;
		}
		return reponse.text()
	}).then((text: string | undefined) => {
		if(!text)
			return;
		var linesRaw: string[] = text.split("\r\n");
		if (linesRaw.length < 2)
			throw Error("No available localization data");

		tr_langData.headers = splitLines(linesRaw[0]);
		linesRaw.splice(0, 1);

		prepData();

		linesRaw.forEach((line: string, index: number) => {
			if(line == "")
				return;
			applyContent(splitLines(line), index);
		})
	});
}

export function ttr(id: string): string {

	let finalData = id;
	tr_langData.langs.forEach((lang: ILangData) => {
		if(lang.code != tr_currentLang)
			return ;
		lang.content.forEach((data: ILangContent) => {
			if(data.id == id)
				finalData = data.data;
		})
	})
	return finalData;
}