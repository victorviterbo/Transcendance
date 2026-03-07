import { createTheme, type ThemeOptions } from "@mui/material";
import type { ITheme } from "../types/styles";

export const appThemeDef: ITheme = {
	// colors: {
	// 	primary: [
	// 		"#FFE3E7",
	// 		"#FFCFD6",
	// 		"#FFB5C0",
	// 		"#EBB9C1",
	// 		"#FF9CAA",
	// 		"#D1909A",
	// 		"#B86C78",
	// 		"#6B1F2A",
	// 		"#522027",
	// 		"#381B20",
	// 	],

	// 	secondary: [
	// 		"#F2C83F",
	// 		"#BFA758",
	// 		"#D9B84E",
	// 		"#A6955D",
	// 		"#8C815D",
	// 		"#736C57",
	// 		"#59564D",
	// 		"#403D36",
	// 		"#333026",
	// 		"#332F21",
	// 	],
	// },

	// colors: {
	// 	primary: [
	// 		"#F52544",
	// 		"#DE354F",
	// 		"#C64256",
	// 		"#AF4A59",
	// 		"#984E59",
	// 		"#814E56",
	// 		"#6A4A4E",
	// 		"#534144",
	// 		"#3B3435",
	// 		"#332A2C",
	// 	],

	// 	secondary: [
	// 		"#25F54E",
	// 		"#37DB57",
	// 		"#44C25D",
	// 		"#4CA85E",
	// 		"#4F8F5B",
	// 		"#4C7554",
	// 		"#455C49",
	// 		"#38423A",
	// 		"#2B332D",
	// 		"#263329",
	// 	],
	// },

	// colors: {
	// 	primary: [
	// 		"#FFF1F4",
	// 		"#FFD6DE",
	// 		"#FFB8C5",
	// 		"#FF94A8",
	// 		"#FF6B84",
	// 		"#F52544",
	// 		"#B31531",
	// 		"#7A0D21",
	// 		"#4A0713",
	// 		"#240309",
	// 	],

	// 	secondary: [
	// 		"#F0FEFF",
	// 		"#CCFBFF",
	// 		"#99F5FF",
	// 		"#66EEFF",
	// 		"#33E6FF",
	// 		"#00D9FF",
	// 		"#00A3CC",
	// 		"#007799",
	// 		"#004D66",
	// 		"#002633",
	// 	],
	// },

	colors: {
		primary: [
			"#F8F1F2",
			"#EFDADF",
			"#E3BCC4",
			"#D39AA5",
			"#C07685",
			"#6B1F2A", // MUI main
			"#571922", // MUI dark
			"#44131A",
			"#320D12",
			"#21080B",
		],

		secondary: [
			"#FFFBEF",
			"#FFF3D1",
			"#FCE8A6",
			"#F8DD7C",
			"#F4D255",
			"#F2C83F", // MUI main
			"#D0A72A", // MUI dark
			"#A8841F",
			"#7C6116",
			"#533F0D",
		],
	},

	positions: {
		mainSpacing: 3,
	},

	bg: {
		baseIndex: 0,
		baseColor: "#44131A",
		baseBlur: 0,

		iconBG: true,
		iconSize: 750,
		iconSpeed: 75,
		iconColor: "#D39AA5",
		iconMove: true,
		iconShadow: {
			offsetX: 1,
			offsetY: 5,
			blur: 0,
			color: "black",
		},

		windmill: false,
		windmillMove: true,
		windmillSpeed: 100,
		windmillShadow: {
			offsetX: 5,
			offsetY: 5,
			color: "black",
		},
		windmillBG: false,
	},
};

const appThemeBase: ThemeOptions = {
	//--------------------------------------------------
	//                   PALETTE
	//--------------------------------------------------
	palette: {
		/* Color Theme Swatches in Hex */

		primary: {
			main: appThemeDef.colors.primary[5],
			light: appThemeDef.colors.primary[4],
			dark: appThemeDef.colors.primary[6],
			contrastText: "#fff",
		},
		secondary: {
			main: appThemeDef.colors.secondary[5],
			light: appThemeDef.colors.secondary[4],
			dark: appThemeDef.colors.secondary[6],
			contrastText: "#fff",
		},

		background: {
			paper:
				"radial-gradient(" +
				appThemeDef.colors.primary[8] +
				" 0%, " +
				appThemeDef.colors.primary[9] +
				" 100%)",
		},
		text: {
			primary: "#fff",
		},
	},

	typography: {
		fontFamily: "MochiyPop, roboto, arial",
	},

	shape: {
		borderRadius: 30,
	},

	components: {
		MuiCssBaseline: {},
	},
};
const appTheme = createTheme(appThemeBase);

export default appTheme;
