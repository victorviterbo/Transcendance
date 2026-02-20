import { ThemeContext } from "@emotion/react";
import { createTheme, type ThemeOptions } from "@mui/material";
import { trTR } from "@mui/material/locale";
const bgImageDark = "./imgs/shared/bg_dark.png"
const bgImage = "./imgs/shared/bg.png"
const bgWoodImage = "./imgs/shared/bg_wood.png"
const blendImageBlack = "./imgs/shared/blend_dark.png"
const blendImageWhite = "./imgs/shared/blend_white.png"
const blendImage = "./imgs/shared/blend.png"
const logoImage = "./imgs/shared/logo.png"

interface ITheme {
	primary: string[]
	secondary: string[]
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
		"#FF9CAA"
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
		"#332F21"
	],
}

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
			contrastText: "#fff"
		},
		secondary: {
			main: appThemeDef.secondary[0],
			light: appThemeDef.secondary[2],
			dark: appThemeDef.secondary[5],
			contrastText: "#fff"
		},

		background: {
			paper: appThemeDef.primary[1]
		},
		text: {
			primary: "#fff"
		}
	},

	components: {

		//Base line
		MuiCssBaseline: {
			styleOverrides: {
				html: {
					height: "100%"
				},
				// body: {
				// 	backgroundColor: "#000",
				// 	background: `url(${logoImage}), url(${blendImage}), url(${blendImage}), url(${bgWoodImage}), url(${bgImage})`,
				// 	backgroundRepeat: "no-repeat, no-repeat, no-repeat, repeat-x, repeat",
				// 	backgroundPosition: "center, center, center, 0 125%, center",
				// 	backgroundSize: "40%, 60%, 30%, 20%, contain",
				// 	backgroundAttachment: "fixed, fixed, fixed, fixed, fixed",
  				// 	backgroundBlendMode: "normal, soft-light, multiply, normal, normal"
				// },
				// body: {
				// 	backgroundColor: "#000",
				// 	background: `url(${logoImage}), url(${blendImage}), url(${blendImage}), url(${bgImage})`,
				// 	backgroundRepeat: "no-repeat, no-repeat, no-repeat, repeat",
				// 	backgroundPosition: "center, center, center, center",
				// 	backgroundSize: "40%, 60%, 30%, contain",
				// 	backgroundAttachment: "fixed, fixed, fixed, fixed",
  				// 	backgroundBlendMode: "normal, soft-light, multiply"
				// },
				// body: {
				// 	backgroundColor: "#000",
				// 	background: `url(${logoImage}), url(${blendImageBlack}), url(${blendImageBlack}), url(${bgWoodImage})`,
				// 	backgroundRepeat: "no-repeat, no-repeat, no-repeat, repeat",
				// 	backgroundPosition: "center, center, center, center",
				// 	backgroundSize: "40%, cover, cover, contain",
				// 	backgroundAttachment: "fixed, fixed, fixed, fixed",
  				// 	backgroundBlendMode: "normal, soft-light, multiply"
				// },
				body: {
					backgroundColor: "#000",
					background: `url(${bgWoodImage})`,
					backgroundRepeat: "repeat, repeat",
					backgroundPosition: "center, center",
					backgroundSize: "contain, contain",
					backgroundAttachment: "fixed, fixed"
				}
				// body: {
				// 	backgroundColor: "#000",
				// 	background: `url(${logoImage}), url(${blendImageWhite}), url(${blendImage}), url(${bgImageDark})`,
				// 	backgroundRepeat: "no-repeat, no-repeat, no-repeat, repeat",
				// 	backgroundPosition: "center, center, center, center",
				// 	backgroundSize: "40%, contain, cover, contain",
				// 	backgroundAttachment: "fixed, fixed, fixed, fixed",
  				// 	backgroundBlendMode: "normal, soft-light, overlay"
				// }
			}
		},
	}
}
const appTheme = createTheme(appThemeBase)

export default appTheme