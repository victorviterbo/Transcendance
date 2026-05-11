import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export const PGameSettingsTagListStyle: SxProps<Theme> = (_) => ({
	flex: 1,

	px: "5px",
	py: "10px",

	backgroundColor: appColors.greys[6],
	borderRadius: appSharedStyle.gameRadius,
	border: "solid 2px " + appColors.primary[1],
	//boxShadow: "0px 4px 0px 0px "  + appColors.primary[2]
});

export const PGameSettingsTagButtonStyle: SxProps<Theme> = (_) => ({
	width: "100%",
	p: "5px",
	borderRadius: appSharedStyle.gameRadius,
});

export const PGameSettingsSplitter: SxProps<Theme> = (_) => ({
	height: "3px",
	width: "95%",
	ml: "0%",
	mt: "5px",
	mb: "20px",

	backgroundColor: appColors.secondary[1],
	borderRadius: appSharedStyle.gameRadius,
});
