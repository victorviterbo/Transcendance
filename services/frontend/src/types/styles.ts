//--------------------------------------------------
//                    CSS
//--------------------------------------------------
export type TDropShadow = {
	offsetX: number | string;
	offsetY: number | string;
	blur?: number | string;
	color: string;
};

//--------------------------------------------------
//                    COLORING
//--------------------------------------------------
export type TColor = {
	r: number;
	g: number;
	b: number;

	rFloat: number;
	gFloat: number;
	bFloat: number;

	rBase: number;
	gBase: number;
	bBase: number;

	major: string;
	majorValue: number;
	minor: string;
	minorValue: number;

	hue: number;
	saturation: number;
	brightness: number;
};
export type TColorAlteration = "shift-saturation" | "shift-brightness";

//--------------------------------------------------
//                   THEME
//--------------------------------------------------

//====================== COLOR ======================
export interface IThemeColor {
	primary: string[];
	secondary: string[];
	tertiary: string[];
	quinary: string[];
	quaternary: string[];
	greys: string[];
	text: IThemeTextColor;
}

export interface IThemeTextColor {
	dark: string;
	light: string;
}

//====================== PSOITIONS ======================
export interface IThemePosition {
	mainSpacing: number;
}

//====================== SHARED ======================
export interface IThemeBGs {
	paper: string;
}

export interface IThemeShared {
	bg: IThemeBGs;
}

//====================== ANIMATIONS ======================
export interface IThemeEasing {
	easeInOut: string;
	easeOut: string;
	easeIn: string;
	sharp: string;
}
export interface IThemeTiming {
	fast: number;
	medium_fast: number;
}
export interface IThemeAnimations {
	timing: IThemeTiming;
	easing: IThemeEasing;
}

//====================== BG ======================
export interface IThemeBG {
	baseIndex: number;
	baseColor: string;
	baseBlur: number;

	iconBG?: boolean;
	iconColor: string;
	iconMove?: boolean;
	iconSize?: number;
	iconSpeed?: number;
	iconShadow?: TDropShadow | string;

	windmill?: boolean;
	windmillMove?: boolean;
	windmillSpeed?: number;
	windmillShadow?: TDropShadow | string;
	windmillBG?: boolean;
}
