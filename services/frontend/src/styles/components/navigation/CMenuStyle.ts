import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const CMenuStyle: SxProps<Theme> = (_) => ({
	"& .MuiMenu-paper": {
		mt: "10px",
		background: appSharedStyle.bg.menu,
		borderRadius: appSharedStyle.radius + "px",
		border: "solid 3px rgba(255, 255, 255, 0.82)",
		boxShadow:
			"0 10px 0 rgba(23, 15, 56, 0.28), 0 18px 32px rgba(23, 15, 56, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.24)",
		overflow: "hidden",
	},

	"& .MuiMenu-list": {
		p: 0.5,
	},
});

export const CMenuItemStyle: SxProps<Theme> = (_) => ({
	borderRadius: "20px",
	py: "10px",
	px: "25px",
	color: appColors.text.light,
	transition: "background 150ms ease, transform 150ms ease",
	"&:hover": {
		background:
			"linear-gradient(135deg, rgba(255, 216, 74, 0.92) 0%, rgba(255, 88, 188, 0.92) 100%)",
		color: appColors.text.dark,
		transform: "translateY(1px)",
	},
});
