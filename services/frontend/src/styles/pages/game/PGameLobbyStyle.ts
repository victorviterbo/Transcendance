import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import type { TScoreOption } from "../../../types/game";

export const PGameLobbyTagStyle: SxProps<Theme> = (_) => ({
	px: "15px",
	py: "5px",

	mx: "5px",

	backgroundColor: appColors.tertiary[0],
	borderRadius: appSharedStyle.gameRadius,
	boxShadow: "0px 2px 0px 0px " + appColors.greys[1],
});

export const PGameLobbyScoreTypeStyle = (scoreType: TScoreOption): SxProps<Theme> => {
	let bgColor = appColors.primary[1];
	if (scoreType == "normal") bgColor = appColors.secondary[0];

	let textColor = appColors.text.light;
	if (scoreType == "normal") textColor = appColors.text.light;

	return {
		px: "15px",
		py: "5px",

		mx: "5px",

		color: textColor,
		backgroundColor: bgColor,
		borderRadius: appSharedStyle.gameRadius,
		boxShadow: "0px 2px 0px 0px " + appColors.greys[1],
	};
};

export const PGameLobbyToggleTypeStyle = (inOn: boolean): SxProps<Theme> => {
	let bgColor = appColors.secondary[0];
	if (!inOn) bgColor = appColors.cancel[0];

	let textColor = appColors.text.light;
	if (!inOn) textColor = appColors.text.light;

	return {
		px: "15px",
		py: "5px",

		mx: "5px",

		color: textColor,
		backgroundColor: bgColor,
		borderRadius: appSharedStyle.gameRadius,
		boxShadow: "0px 2px 0px 0px " + appColors.greys[1],
	};
};
