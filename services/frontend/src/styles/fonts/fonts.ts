import type { CSSObject } from "@mui/material/styles";
import Knewave from "./Knewave.ttf";
import CherryBomb from "./CherryBomb.ttf";
import MochiyPop from "./MochiyPop.ttf";
import DynaPuffRegular from "./DynaPuff-Regular.ttf";
import DynaPuffMedium from "./DynaPuff-Medium.ttf";
import DynaPuffSemiBold from "./DynaPuff-SemiBold.ttf";
import DynaPuffBold from "./DynaPuff-Bold.ttf";
import MPlusThin from "./MPLUS1-Thin.ttf";
import MPlusExLight from "./MPLUS1-ExtraLight.ttf";
import MPlusLight from "./MPLUS1-Light.ttf";
import MPlusRegular from "./MPLUS1-Regular.ttf";
import MPlusMedium from "./MPLUS1-Medium.ttf";
import MPlusSemiBold from "./MPLUS1-SemiBold.ttf";
import MPlusBold from "./MPLUS1-Bold.ttf";
import MPlusExtraBold from "./MPLUS1-ExtraBold.ttf";
import MPlusExtraBlack from "./MPLUS1-Black.ttf";

function makeFontFace(name: string, target: string, weight: number, style: string): CSSObject {
	return {
		"@font-face": {
			fontFamily: name,
			src: `url(${target}) format('truetype')`,
			fontWeight: weight,
			fontStyle: style,
		},
	};
}

function makeFontFaceMW(
	name: string,
	target: string[],
	weight: number[],
	style: string,
): CSSObject[] {
	if (target.length != weight.length) return [];

	const finalArray: CSSObject[] = [];
	for (let i = 0; i < target.length; i++) {
		finalArray.push(makeFontFace(name, target[i], weight[i], style));
	}
	return finalArray;
}

export function getFontRegistry(): CSSObject[] {
	const fonts: CSSObject[] = [];

	fonts.push(makeFontFace("Knewave", Knewave, 400, "normal"));
	fonts.push(makeFontFace("CherryBomb", CherryBomb, 400, "normal"));
	fonts.push(makeFontFace("MochiyPop", MochiyPop, 400, "normal"));
	fonts.push(
		...makeFontFaceMW(
			"DynaPuff",
			[DynaPuffRegular, DynaPuffMedium, DynaPuffSemiBold, DynaPuffBold],
			[400, 500, 600, 700],
			"normal",
		),
	);
	fonts.push(
		...makeFontFaceMW(
			"MPlus",
			[
				MPlusThin,
				MPlusExLight,
				MPlusLight,
				MPlusRegular,
				MPlusMedium,
				MPlusSemiBold,
				MPlusBold,
				MPlusExtraBold,
				MPlusExtraBlack,
			],
			[100, 200, 300, 400, 500, 600, 700, 800, 900],
			"normal",
		),
	);
	return fonts;
}
