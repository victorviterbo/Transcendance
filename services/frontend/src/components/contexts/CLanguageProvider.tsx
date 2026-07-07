import {
	cloneElement,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type Context,
	type ReactElement,
	type ReactNode,
} from "react";
import { getLanguage, getLocalization, writeStoredLanguage } from "../../localization/localization";

import type {
	ILangContent,
	ILangContext,
	ILangData,
	ILocalizationData,
} from "../../types/localizationTypes";
import { NUMBER_FORMAT_LOCALES } from "../../constants";
import GLoading from "../../pages/common/GLoading";
import { useNotif } from "./CAppNotifContext";

interface CLanguageContextProps {
	children: ReactNode;
}

const langContext: Context<ILangContext> = createContext<ILangContext>({
	currentLang: "en",
	ttr: (id: string): string => {
		return id;
	},
	ttrf: (id: string, _: Record<string, string>) => {
		return id;
	},
	ttrfn: (id: string, _: Record<string, ReactElement>) => {
		return [<div key={"default"}>{id}</div>];
	},
	ttrn: (value: number, _?: Intl.NumberFormatOptions) => {
		return value.toString();
	},
	ttrd: (value: string | number | Date, _?: Intl.DateTimeFormatOptions) => {
		return value.toString();
	},
	formatPercentage: (value: number) => {
		return value.toString();
	},
	formatSeconds: (value: number) => {
		return value.toString();
	},
	changeLang: (_: string) => {},
});

export const useLang = (): ILangContext => {
	return useContext(langContext);
};

function CLanguageProvider({ children }: CLanguageContextProps) {
	//====================== DATA ======================
	const [currentLang, setCurrentLang] = useState<string>(getLanguage());
	const [langData, setLangData] = useState<undefined | ILocalizationData>(undefined);
	const [notifSent, setNotifSent] = useState<boolean>(false);
	const { push } = useNotif();

	//====================== EFFECT ======================
	useEffect(() => {
		const loadLocalization = async () => {
			const data: ILocalizationData = await getLocalization();
			setCurrentLang(getLanguage(data));
			setLangData(data);
		};
		loadLocalization();
	}, [setLangData]);

	useEffect(() => {
		const checkValid = async () => {
			if (!langData || notifSent) return;
			if (langData.headers.length == 0 || langData.langs.length == 0) {
				let msg = "Failed to loaded localization file.";
				if (currentLang == "fr") msg = "Impossible de charger le fichier de localisation.";
				else if (currentLang == "ja") msg = "ローカライズファイルを読み込めませんでした";
				else if (currentLang == "de")
					msg = "Die Lokalisierungsdatei konnte nicht geladen werden.";
				push({
					severity: "error",
					message: msg,
				});
				setNotifSent(true);
			}
		};
		checkValid();
	}, [push, langData, currentLang, notifSent, setNotifSent]);

	//====================== FUNCTIONS ======================
	const ttr = useCallback(
		(id: string): string => {
			if (!langData) return id;

			let finalData = id;
			langData.langs.forEach((lang: ILangData) => {
				if (lang.code != currentLang) return;
				lang.content.forEach((data: ILangContent) => {
					if (data.id == id) finalData = data.data;
				});
			});
			return finalData;
		},
		[langData, currentLang],
	);

	const ttrf = useCallback(
		(id: string, params: Record<string, string>): string => {
			let text = ttr(id);
			for (const [key, value] of Object.entries(params)) {
				text = text.replaceAll(`{${key}}`, String(value));
			}
			return text;
		},
		[ttr],
	);

	const ttrfn = useCallback(
		(id: string, params: Record<string, ReactElement>): ReactNode[] => {
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
		},
		[ttr],
	);

	const ttrn = useCallback(
		(value: number, options?: Intl.NumberFormatOptions): string => {
			const locale = NUMBER_FORMAT_LOCALES[currentLang] ?? NUMBER_FORMAT_LOCALES.en;
			return new Intl.NumberFormat(locale, options).format(value);
		},
		[currentLang],
	);

	const ttrd = useCallback(
		(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
			const locale = NUMBER_FORMAT_LOCALES[currentLang] ?? NUMBER_FORMAT_LOCALES.en;
			const date = value instanceof Date ? value : new Date(value);
			return new Intl.DateTimeFormat(locale, options).format(date);
		},
		[currentLang],
	);

	const formatPercentage = useCallback(
		(value: number) => {
			return `${ttrn(value, {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1,
			})}%`;
		},
		[ttrn],
	);

	const formatSeconds = useCallback(
		(value: number) => {
			return `${ttrf("SECONDS", {
				COUNT: ttrn(value, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
				}),
			})}`;
		},
		[ttrf, ttrn],
	);

	const changeLang = useCallback(
		(value: string) => {
			setCurrentLang(value);
			writeStoredLanguage(value);
		},
		[setCurrentLang],
	);

	if (!langData) {
		return <GLoading />;
	}

	return (
		<langContext.Provider
			value={{
				currentLang,
				ttr,
				ttrf,
				ttrfn,
				ttrn,
				ttrd,
				formatPercentage,
				formatSeconds,
				changeLang,
			}}
		>
			{children}
		</langContext.Provider>
	);
}

export default CLanguageProvider;
