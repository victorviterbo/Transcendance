import { createTheme, type ThemeOptions } from "@mui/material";

interface ITheme {
	primary: string[];
	secondary: string[];
}

export const appThemeDef: ITheme = {
	primary: [
		"#6B1F2A",
		"#381B20",
		"#522027",
		"#B86C78",
		"#D1909A",
		"#EBB9C1",
		"#FFE3E7",
		"#FFCFD6",
		"#FFB5C0",
		"#FF9CAA",
	],

	secondary: [
		"#F2C83F",
		"#BFA758",
		"#D9B84E",
		"#A6955D",
		"#8C815D",
		"#736C57",
		"#59564D",
		"#403D36",
		"#333026",
		"#332F21",
	],
};

const appThemeBase: ThemeOptions = {
	//--------------------------------------------------
	//                   PALETTE
	//--------------------------------------------------
	palette: {
		mode: "dark",

		/* Color Theme Swatches in Hex */

		primary: {
			main: appThemeDef.primary[0],
			light: appThemeDef.primary[5],
			dark: appThemeDef.primary[1],
			contrastText: "#fff",
		},
		secondary: {
			main: appThemeDef.secondary[0],
			light: appThemeDef.secondary[2],
			dark: appThemeDef.secondary[5],
			contrastText: "#fff",
		},

		background: {
			paper: appThemeDef.primary[1],
		},
		text: {
			primary: "#fff",
		},
	},
};
const appTheme = createTheme(appThemeBase);

export default appTheme;
