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
//                   THEME
//--------------------------------------------------
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

export interface IThemeColor {
	primary: string[];
	secondary: string[];
}

export interface IThemePosition {
	mainSpacing: number;
}

export interface ITheme {
	colors: IThemeColor;
	positions: IThemePosition;
	bg: IThemeBG;
}
