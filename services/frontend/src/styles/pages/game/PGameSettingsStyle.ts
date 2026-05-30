import type { SxProps, Theme } from "@mui/material";
import theme, { appAnimation, appColors, appSharedStyle } from "../../theme";

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

export const PGameSettingsCodeBlockStyle: SxProps<Theme> = (_) => ({
	ml: "30px",

	px: "10px",
	pt: "10px",
	pb: "15px",

	backgroundColor: appColors.greys[6],
	borderRadius: appSharedStyle.gameRadius,
	border: "solid 2px " + appColors.primary[1],
});

export const PGameSettingsCopyStyle = (active: boolean, abs: boolean): SxProps<Theme> => {
	return {
		position: abs ? "absolute" : undefined,
		opacity: active ? 1 : 0,

		transition: theme.transitions.create(["opacity"], {
			duration: appAnimation.timing.medium_slow,
		}),
	};
};
