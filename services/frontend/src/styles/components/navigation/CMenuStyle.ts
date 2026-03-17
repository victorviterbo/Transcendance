import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const CMenuStyle: SxProps<Theme> = (_) => ({
	"& .MuiMenu-paper": {
		mt: "10px",
		background: appSharedStyle.bg.menu,
		borderRadius: appSharedStyle.radius / 2 + "px",
		border: "solid 2px white",
	},

	"& .MuiMenu-list": {
		p: 0,
	},
});

export const CMenuItemStyle: SxProps<Theme> = (_) => ({
	background: appColors.tertiary[0],
	py: "7px",
	px: "25px",
});
