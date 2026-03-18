import { createTheme, type ThemeOptions } from "@mui/material";
import { colorGetBackground } from "../utils/styles";
import type {
	IThemeAnimations,
	IThemeBG,
	IThemeColor,
	IThemePosition,
	IThemeShared,
} from "../types/styles";

//--------------------------------------------------
//                                    NAME
//--------------------------------------------------
//export const appThemeDef: ITheme = {
// colors: {
// 	primary: ["#0F1FFA", "#414DFA", "#737CFA", "#A5ABFA", "#e5e7fd"],

// 	secondary: ["#0FB3FA", "#3A93BA", "#456A7A", "#30373B"],

// 	tertiary: ["#990FFA", "#853ABA", "#64457A", "#36303B"],
// },
// colors: {
// 	primary: ["#23FAEF", "#3CD5CE", "#4BB1AC", "#508D8A", "#4A6867", "#3A4443"],

// 	secondary: ["#FAD323", "#CFB640", "#A5954E", "#7A734E", "#504D40", "#33312A"],

// 	tertiary: ["#FA23D4", "#CF40B6", "#A54E95", "#7A4E73", "#50404D", "#332A31"],
// },

export const appColors: IThemeColor = {
	primary: ["#42EDFF", "#28D5F3", "#1EB4DA", "#1A90B8", "#176B8F", "#134B67"],
	secondary: ["#FFD84A", "#F9C83A", "#E7AF28", "#CC8E17", "#9D6711", "#68440A"],
	tertiary: ["#FF58BC", "#F240AA", "#DA2E92", "#B82375", "#861B56", "#561439"],
	quaternary: ["#536BFF", "#455CEB", "#394DCD", "#303FA6", "#253073", "#1A2149"],
	quinary: ["#9363FF", "#7D57F3", "#6946DD", "#5535B8", "#3F2785", "#291C56"],

	greys: [
		"#FFFFFF",
		"#F7F5FF",
		"#ECE8FF",
		"#D8D0F7",
		"#BDB3E9",
		"#988DCC",
		"#7467A5",
		"#51487C",
		"#302953",
		"#17122E",
	],

	text: {
		dark: "#170F38",
		light: "#fff",
	},
};

export const appPositions: IThemePosition = {
	mainSpacing: 4,
	sizes: {
		buttons: {
			home: "52px",
			nav: "44px",
		},

		footer: 40,
	},
};

export const appSharedStyle: IThemeShared = {
	bg: {
		paper: `linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 18%, rgba(255, 255, 255, 0.02) 100%), linear-gradient(145deg, #3E49B7 0%, #5038C1 45%, #842DC4 100%)`,
		header: `linear-gradient(135deg, rgba(82, 107, 255, 0.92) 0%, rgba(52, 215, 250, 0.9) 46%, rgba(255, 88, 188, 0.84) 100%)`,
		feedback: colorGetBackground(
			[appColors.primary[0], appColors.tertiary[0]],
			[0, 100],
			"linear",
			130,
		),
		menu: colorGetBackground(
			[appColors.quaternary[1], appColors.quinary[1]],
			[0, 100],
			"linear",
			140,
		),
	},

	radius: 28,
};

export const appAnimation: IThemeAnimations = {
	timing: {
		fast: 100,
		medium_fast: 150,
	},
	easing: {
		easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
		easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
		easeIn: "cubic-bezier(0.4, 0, 1, 1)",
		sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
	},
	bg: {
		buttonHover: {
			active: true,
			size: "320%",
			speed: 1400,
			duration: 22,
		},
	},
};

export const appBG: IThemeBG = {
	baseIndex: 0,
	baseColor:
		"radial-gradient(circle at 12% 16%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 20%), radial-gradient(circle at 86% 18%, rgba(255, 216, 74, 0.28) 0%, rgba(255, 216, 74, 0) 18%), radial-gradient(circle at 72% 82%, rgba(255, 88, 188, 0.24) 0%, rgba(255, 88, 188, 0) 20%), linear-gradient(160deg, #3AE8FF 0%, #2BA8FF 38%, #5B5DFF 70%, #FF55BB 100%)",
	baseBlur: 0,

	iconBG: true,
	iconSize: 560,
	iconSpeed: 55,
	iconColor: colorGetBackground(
		["rgba(255, 255, 255, 0.22)", "rgba(255, 255, 255, 0.06)"],
		undefined,
		"linear",
		135,
	),
	iconMove: true,
	iconShadow: {
		offsetX: 1,
		offsetY: 8,
		blur: 24,
		color: "rgba(17, 10, 53, 0.24)",
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
};

//--------------------------------------------------
//               MUI THEME OVERRIDE
//		   **Above theme should be prefered**
//--------------------------------------------------
const appThemeBase: ThemeOptions = {
	palette: {
		/* Color Theme Swatches in Hex */

		primary: {
			main: appColors.primary[0],
			light: appColors.primary[2],
			dark: appColors.primary[1],
			contrastText: "#fff",
		},
		secondary: {
			main: appColors.secondary[0],
			light: appColors.secondary[2],
			dark: appColors.secondary[1],
			contrastText: "#fff",
		},

		background: {
			paper: appSharedStyle.bg.paper,
		},
		text: {
			primary: "#fff",
		},
	},

	typography: {
		fontFamily: "DynaPuff, MochiyPop, sans-serif",
	},

	shape: {
		borderRadius: appSharedStyle.radius,
	},

	components: {
		MuiCssBaseline: {
			styleOverrides: {
				"*": {
					boxSizing: "border-box",
				},
				"html, body, #root": {
					height: "100%",
				},
				body: {
					margin: 0,
					backgroundColor: appColors.quaternary[4],
					color: appColors.text.light,
				},
				a: {
					color: "inherit",
				},
				"::selection": {
					backgroundColor: "rgba(255, 216, 74, 0.35)",
					color: appColors.text.dark,
				},
				"::-webkit-scrollbar": {
					width: "12px",
					height: "12px",
				},
				"::-webkit-scrollbar-thumb": {
					background:
						"linear-gradient(180deg, rgba(255, 216, 74, 0.92) 0%, rgba(255, 88, 188, 0.92) 100%)",
					borderRadius: "999px",
					border: "3px solid rgba(23, 18, 46, 0.24)",
				},
				"::-webkit-scrollbar-track": {
					backgroundColor: "rgba(23, 18, 46, 0.18)",
				},
			},
		},
	},
};
const appTheme = createTheme(appThemeBase);

export default appTheme;
