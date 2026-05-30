import { type Theme } from "@mui/material";
import { appAnimation, appColors, appSharedStyle, appTexts } from "../../theme";

export interface CTextFieldStyleProps {
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;

	borderWidth?: string;
	borderRadius?: string;
	verticalPadding?: string;
}

export function CTextFieldStyle(
	theme: Theme,
	{
		fontSize,
		fontFamily,
		fontWeight,
		borderWidth,
		borderRadius,
		verticalPadding,
	}: CTextFieldStyleProps,
) {
	return {
		//Label
		"& .MuiInputLabel-root": {
			color: appColors.greys[0],
			pl: "5px",
			transition: theme.transitions.create(["color", "transform", "max-width"], {
				duration: appAnimation.timing.medium_fast,
				easing: appAnimation.easing.easeInOut,
			}),
		},
		"&:hover .MuiInputLabel-root": {
			color: appColors.secondary[0],
			pl: "5px",
		},
		"& .MuiInputLabel-root.Mui-focused  ": {
			color: appColors.secondary[0],
			pl: "5px",
		},

		"& .MuiInputLabel-root.Mui-error ": {
			color: theme.palette.error.main,
			pl: "5px",
		},

		//Input root
		"& .MuiOutlinedInput-root": {
			backgroundColor: appColors.greys[8],
			transition: theme.transitions.create(["background-color"], {
				duration: appAnimation.timing.medium_fast,
			}),
			fontSize: fontSize == undefined ? appTexts.text.sizes.md : fontSize,
			fontFamily: fontFamily == undefined ? appTexts.text.mainFamily : fontFamily,
			fontWeight: fontWeight == undefined ? 400 : fontWeight,
		},

		"&:hover .MuiOutlinedInput-root": {
			backgroundColor: appColors.greys[7],
			border: "none",
		},

		"& .MuiOutlinedInput-root.Mui-focused": {
			backgroundColor: appColors.greys[7],
		},

		//INput objkect
		"& .MuiOutlinedInput-root .MuiInputBase-input": {
			py: verticalPadding,
		},

		//Outline
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: appColors.primary[0],
			borderRadius: borderRadius == undefined ? appSharedStyle.radius : borderRadius,
			borderWidth: borderWidth ? borderWidth : "4px",
			transition: theme.transitions.create(["border-color"], {
				duration: appAnimation.timing.medium_fast,
			}),
		},
		"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: () => appColors.secondary[0],
			borderWidth: borderWidth ? borderWidth : "4px",
		},
		"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
			borderColor: appColors.secondary[0],
			borderWidth: borderWidth ? borderWidth : "4px",
		},

		"& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.palette.error.main,
		},
	};
}
