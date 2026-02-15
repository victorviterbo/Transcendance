import { createTheme } from "@mui/material";
const bgImageDark = "./imgs/shared/bg_dark.png"
const bgImage = "./imgs/shared/bg.png"
const bgWoodImage = "./imgs/shared/bg_wood.png"
const blendImageBlack = "./imgs/shared/blend_dark.png"
const blendImageWhite = "./imgs/shared/blend_white.png"
const blendImage = "./imgs/shared/blend.png"
const logoImage = "./imgs/shared/logo.png"

const appTheme = createTheme({

	palette: {
		mode: "dark",
		primary: {
			main: "#6B1F2A",
			light: "#AF616D",
			dark: "#381B20",
			contrastText: "#fff"
		},
		secondary: {
			main: "#B89954",
			light: "#C9A24E",
			dark: "#968359",
			contrastText: "#fff"
		},

		background: {
			paper: "#381B20"
			//paper: "#b1ada7"
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
		}
	}
})

export default appTheme