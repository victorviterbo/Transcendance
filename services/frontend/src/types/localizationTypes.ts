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
