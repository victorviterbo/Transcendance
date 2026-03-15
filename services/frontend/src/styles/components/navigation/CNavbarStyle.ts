import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const CNavbarStyle: SxProps<Theme> = (_) => ({
	background: appSharedStyle.bg.header ? appSharedStyle.bg.header : appSharedStyle.bg.paper,
});

export const CNavbarLinkStyle = (active: boolean): SxProps => {
	return {
		textDecoration: "none",
		color: "inherit",
		display: "inline-flex",
		alignItems: "center",
		gap: 1,
		px: 1.5,
		py: 0.5,
		borderRadius: 1,
		border: "solid 4px " + appColors.text.light,
		backgroundColor: active ? appColors.primary[0] : appColors.secondary[0],
		"&:hover": {
			backgroundColor: active ? appColors.primary[1] : appColors.secondary[1],
		},
	};
};
