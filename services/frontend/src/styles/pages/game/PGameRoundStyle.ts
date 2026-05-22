import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import type { IGameRound } from "../../../types/game";

export const PGameRoundGameProgressBoxStyle: SxProps<Theme> = (_) => ({
	px: "15px",
	py: "5px",

	mx: "5px",

	backgroundColor: appColors.greys[6],
	borderRadius: appSharedStyle.gameRadius,
});

export const PGameRoundStateNodeStyle = (round: IGameRound): SxProps<Theme> => {
	let bgColor = appColors.greys[7];
	if (round.phase == "done") {
		if (round.points == 0) bgColor = appColors.cancel[0];
		if (round.points == 5) bgColor = appColors.secondary[0];
		if (round.points == 10) bgColor = appColors.primary[0];
	}

	return {
		height: "100%",
		px: "10px",

		justifyContent: "center",

		backgroundColor: bgColor,
		borderRadius: "100px",
	};
};
