import { createTheme, type ThemeOptions } from "@mui/material";
import type { ITheme } from "../types/styles";

export const appThemeDef: ITheme = {
	colors: {
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
	},

	positions: {
		mainSpacing: 2,
	},

	bg: {
		brightness: 0.75,
	},
};

const appThemeBase: ThemeOptions = {
	//--------------------------------------------------
	//                   PALETTE
	//--------------------------------------------------
	palette: {
		mode: "dark",

		/* Color Theme Swatches in Hex */

		primary: {
			main: appThemeDef.colors.primary[0],
			light: appThemeDef.colors.primary[5],
			dark: appThemeDef.colors.primary[1],
			contrastText: "#fff",
		},
		secondary: {
			main: appThemeDef.colors.secondary[0],
			light: appThemeDef.colors.secondary[2],
			dark: appThemeDef.colors.secondary[5],
			contrastText: "#fff",
		},

		background: {
			paper: appThemeDef.colors.primary[1],
		},
		text: {
			primary: "#fff",
		},
	},

	shape: {
		borderRadius: 10,
	},

	components: {
		MuiCssBaseline: {
			styleOverrides: {},
		},
	},
};
const appTheme = createTheme(appThemeBase);

export default appTheme;
