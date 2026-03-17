import { createTheme, type ThemeOptions } from "@mui/material";
import { colorAlterColor, colorGetBackground } from "../utils/styles";
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
	primary: ["#1FE2D8", "#38C2BC", "#49A29E", "#4C827F", "#496160", "#3A4443"],
	secondary: ["#E2BF1F", "#C2A63D", "#A28A4C", "#82704C", "#615440", "#33312A"],
	tertiary: ["#E21FBF", "#C23DA6", "#A24C88", "#824C6E", "#614054", "#332A31"],
	quaternary: ["#414DFA", "#5560D6", "#6168B3", "#62688F", "#585B6B", "#41434A"],
	quinary: ["#8A41FA", "#7D55D6", "#715FB3", "#665F8F", "#57566B", "#44424A"],

	greys: [
		"#E1E1E1",
		"#CBCBCB",
		"#B5B5B5",
		"#9E9E9E",
		"#888888",
		"#727272",
		"#5C5C5C",
		"#454545",
		"#2F2F2F",
		"#191919",
	],

	text: {
		dark: "#000",
		light: "#fff",
	},
};

export const appPositions: IThemePosition = {
	mainSpacing: 7,
	socialMargin: { top: 15, right: 20, bottom: 50 },
	sizes: {
		buttons: {
			home: "40px",
			nav: "35px",
		},

		friends: "25%",

		header: 68,
		footer: 50,
	},
};

export const appSharedStyle: IThemeShared = {
	bg: {
		paper: colorGetBackground(
			[appColors.greys[9], appColors.greys[8]],
			undefined,
			"radial",
			135 + 180,
		),
		feedback: colorGetBackground(
			[appColors.primary[1], appColors.quinary[1]],
			[0, 100],
			"linear",
			225,
		),
		menu: colorGetBackground(
			[appColors.primary[1], appColors.quinary[1]],
			[0, 100],
			"linear",
			225,
		),
		drawer: colorGetBackground(
			[appColors.greys[9], appColors.greys[8]],
			undefined,
			"radial",
			135 + 180,
		),
	},

	radius: 30,
};

export const appAnimation: IThemeAnimations = {
	timing: {
		fast: 100,
		medium_fast: 150,
		enteringScreen: 225,
		leavingScreen: 195,
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
			size: "400%",
			speed: 1750,
			duration: 180,
		},
	},
};

export const appBG: IThemeBG = {
	baseIndex: 0,
	baseColor: colorGetBackground(
		[
			colorAlterColor(
				appColors.quinary[0],
				["shift-saturation", "shift-brightness"],
				[-0.0, -0.1],
			),
			colorAlterColor(
				appColors.quaternary[0],
				["shift-saturation", "shift-brightness"],
				[-0.0, -0.0],
			),
		],
		undefined,
		"linear",
		135 + 180,
	),
	baseBlur: 0,

	iconBG: true,
	iconSize: 750,
	iconSpeed: 75,
	iconColor: colorGetBackground(
		[
			colorAlterColor(
				appColors.quinary[0],
				["shift-saturation", "shift-brightness"],
				[-0.15, -0.15],
			),
			colorAlterColor(
				appColors.quaternary[0],
				["shift-saturation", "shift-brightness"],
				[-0.15, -0.05],
			),
		],
		undefined,
		"linear",
		135 + 180,
	),
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
		fontFamily: "MochiyPop, roboto, arial",
	},

	shape: {
		borderRadius: appSharedStyle.radius,
	},

	components: {
		MuiCssBaseline: {},
	},
};
const appTheme = createTheme(appThemeBase);

export default appTheme;
