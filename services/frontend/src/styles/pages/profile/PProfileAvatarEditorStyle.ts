import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export interface IProfileAvatarEditorStyle {
	avatar: SxProps<Theme>;
	button: SxProps<Theme>;
	preview: SxProps<Theme>;
	progress: SxProps<Theme>;
	helperText: SxProps<Theme>;
	errorText: SxProps<Theme>;
	secondaryText: SxProps<Theme>;
}

export const PProfileAvatarEditorStyle = (): IProfileAvatarEditorStyle => ({
	avatar: {
		width: 88,
		height: 88,
		bgcolor: appColors.secondary[0],
		color: appColors.text.dark,
		fontWeight: "bold",
		fontSize: "2rem",
	},
	button: {
		position: "absolute",
		right: -6,
		bottom: -6,
		backgroundColor: appColors.secondary[0],
		opacity: 0.95,
		color: appColors.text.dark,
		"&:hover": {
			backgroundColor: appColors.secondary[1],
		},
		border: `2px solid ${appColors.greys[0]}`,
		boxShadow: `0px 3px 0px 0px ${appColors.greys[9]}`,
	},
	preview: {
		width: 132,
		height: 132,
		bgcolor: appColors.secondary[0],
		color: appColors.text.dark,
		fontWeight: "bold",
		fontSize: "3rem",
	},
	progress: {
		color: "inherit",
	},
	helperText: {
		color: appColors.greys[1],
		pt: 1,
	},
	errorText: {
		color: appColors.cancel[0],
		mt: 1,
	},
	secondaryText: {
		color: appColors.greys[1],
	},
});
