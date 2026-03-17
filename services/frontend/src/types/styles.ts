//--------------------------------------------------
//                    CSS
//--------------------------------------------------
export type TDropShadow = {
	offsetX: number | string;
	offsetY: number | string;
	blur?: number | string;
	color: string;
};

export type TMargin = {
	top?: number | string;
	right?: number | string;
	bottom?: number | string;
	left?: number | string;
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
export type TColorAlteration = "shift-saturation" | "shift-brightness" | "shift-hue";

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
export interface IThemeSize {
	buttons: {
		home: number | string;
		nav: number | string;
	};

	friends: number | string;

	header: number | number;
	footer: number | string;
}
export interface IThemePosition {
	mainSpacing: number;

	socialMargin: TMargin;

	sizes: IThemeSize;
}

//====================== SHARED ======================
export interface IThemeBGs {
	paper: string;
	header?: string;
	feedback: string;
	menu: string;
	drawer: string;
}

export interface IThemeShared {
	bg: IThemeBGs;
	radius: number;
}

//====================== ANIMATIONS ======================
export interface IThemeBGAnim {
	active: boolean;
	size?: string | number;
	speed?: number;
	duration?: number;
}

export interface IThemeBGAnimList {
	buttonHover?: IThemeBGAnim;
}

export interface IThemeEasing {
	easeInOut: string;
	easeOut: string;
	easeIn: string;
	sharp: string;
}
export interface IThemeTiming {
	fast: number;
	medium_fast: number;
	enteringScreen: number;
	leavingScreen: number;
}
export interface IThemeAnimations {
	timing: IThemeTiming;
	easing: IThemeEasing;
	bg: IThemeBGAnimList;
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
