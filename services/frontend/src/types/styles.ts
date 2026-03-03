export interface IThemeBG {
	brightness: number;
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
