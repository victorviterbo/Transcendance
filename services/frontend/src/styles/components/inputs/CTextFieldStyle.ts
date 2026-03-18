import { type SxProps, type Theme } from "@mui/material";
import { appAnimation, appColors } from "../../theme";

export const CTextFieldStyle: SxProps<Theme> = (theme) => ({
	//Label
	"& .MuiInputLabel-root": {
		color: "rgba(255, 255, 255, 0.78)",
		fontFamily: "DynaPuff, sans-serif",
		fontWeight: 600,
		letterSpacing: "0.03em",
		textTransform: "uppercase",
		pl: "6px",
		transition: theme.transitions.create(["color", "transform", "max-width"], {
			duration: appAnimation.timing.medium_fast,
			easing: appAnimation.easing.easeInOut,
		}),
	},
	"&:hover .MuiInputLabel-root": {
		color: appColors.secondary[0],
		pl: "6px",
	},
	"& .MuiInputLabel-root.Mui-focused  ": {
		color: appColors.secondary[0],
		pl: "6px",
	},

	"& .MuiInputLabel-root.Mui-error ": {
		color: theme.palette.error.main,
		pl: "6px",
	},

	//Input root
	"& .MuiInputBase-input": {
		color: appColors.text.light,
		fontWeight: 500,
	},
	"& .MuiOutlinedInput-root": {
		backgroundColor: "rgba(23, 15, 56, 0.24)",
		borderRadius: "22px",
		backdropFilter: "blur(14px)",
		boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14)",
		transition: theme.transitions.create(["background-color", "box-shadow"], {
			duration: appAnimation.timing.medium_fast,
		}),
	},

	"&:hover .MuiOutlinedInput-root": {
		backgroundColor: "rgba(23, 15, 56, 0.32)",
	},

	"& .MuiOutlinedInput-root.Mui-focused": {
		backgroundColor: "rgba(23, 15, 56, 0.36)",
		boxShadow: "0 0 0 6px rgba(255, 216, 74, 0.12)",
	},

	//Outline
	"& .MuiOutlinedInput-notchedOutline": {
		borderColor: "rgba(255, 255, 255, 0.72)",
		borderWidth: "3px",
		transition: theme.transitions.create(["border-color", "border-width"], {
			duration: appAnimation.timing.medium_fast,
		}),
	},
	"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
		borderColor: appColors.primary[0],
		borderWidth: "3px",
	},
	"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
		borderColor: appColors.secondary[0],
		borderWidth: "3px",
	},

	"& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
		borderColor: theme.palette.error.main,
	},

	"& .MuiFormHelperText-root": {
		marginLeft: 0,
		marginTop: theme.spacing(0.75),
		color: "rgba(255, 255, 255, 0.78)",
	},
});
