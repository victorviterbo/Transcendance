import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import type { IGameRound } from "../../../types/game";
import type { IGamePlayerAnswer } from "../../../types/game";
import { colorGetBackground } from "../../../utils/styles";

//--------------------------------------------------
//                      MAIN
//--------------------------------------------------
export interface IGameRoundStyle {
	progressBox: SxProps<Theme>;
	pointBox: SxProps<Theme>;
	pointBoxTextList: SxProps<Theme>;
	pointBoxPointList: SxProps<Theme>;
	pointBoxPointSumup: SxProps<Theme>;
}

export const PGameRoundStyle = (): IGameRoundStyle => {
	return {
		progressBox: {
			px: "15px",
			py: "5px",

			mx: "5px",

			backgroundColor: appColors.greys[6],
			borderRadius: appSharedStyle.gameRadius,
		},
		pointBox: {
			mt: "15px",
			mr: "5px",
			background: colorGetBackground(
				[appColors.primary[1], appColors.tertiary[1]],
				undefined,
				"linear",
				305,
			),
			borderRadius: appSharedStyle.gameRadius,
		},
		pointBoxTextList: {
			pl: "10px",
			py: "7px",

			backgroundColor: appColors.greys[6],

			borderTopLeftRadius: appSharedStyle.gameRadius,
			borderBottomLeftRadius: appSharedStyle.gameRadius,
		},
		pointBoxPointList: {
			flex: 1,
			backgroundColor: appColors.greys[6],
			pl: "5px",
			pr: "auto",
			py: "7px",
		},
		pointBoxPointSumup: {
			justifyContent: "center",
			alignItems: "center",
			px: "15px",
		},
	};
};

//--------------------------------------------------
//                      STATE
//--------------------------------------------------
export interface IGameRoundStateNodeStyle {
	main: SxProps<Theme>;
}

export const PGameRoundStateNodeStyle = (round: IGameRound): IGameRoundStateNodeStyle => {
	let bgColor = appColors.greys[7];
	if (round.phase == "done") {
		if (round.artistFound && round.titleFound) bgColor = appColors.primary[0];
		else if(round.artistFound || round.titleFound) bgColor = appColors.secondary[0];
		else bgColor = appColors.cancel[0];
	}

	return {
		main: {
			width: "30px",
			height: "30px",
			ml: "4px",
			mb: "5px",

			justifyContent: "center",

			backgroundColor: bgColor,
			borderRadius: "100px",
			border: round.phase == "playing" ? "solid 2px " + appColors.tertiary[0] : undefined,
			boxShadow: round.phase == "done" ? "0px 2px 0px 0px white" : undefined,
		},
	};
};

//--------------------------------------------------
//                       TRACKER
//--------------------------------------------------
export interface IGameRoundTrackerStyle {
	pinbox: SxProps<Theme>;
	bar: SxProps<Theme>;
}

export const PGameRoundTrackerStyle = (): IGameRoundTrackerStyle => {
	return {
		pinbox: {
			position: "relative",
			height: "55px",
		},
		bar: {
			height: "7px",
			borderRadius: appSharedStyle.gameRadius,

			background: appColors.greys[5],

			"& .MuiLinearProgress-bar": {
				borderRadius: appSharedStyle.gameRadius,
			},
		},
	};
};

export interface IGameRoundTrackerPinStyle {
	top: SxProps<Theme>;
	bottom: SxProps<Theme>;
}

export const PGameRoundTrackerPinStyle = (): IGameRoundTrackerPinStyle => {
	return {
		top: {
			height: "35px",
			width: "35px",
			p: "5px",
			borderRadius: appSharedStyle.gameRadius,
			backgroundColor: appColors.primary[0],
		},
		bottom: {
			width: "3px",
			height: "20px",
			backgroundColor: appColors.primary[1],
		},
	};
};

//--------------------------------------------------
//                       ANSWER
//--------------------------------------------------
export interface IGameRoundAnswerStyle {
	main: SxProps<Theme>;
	message: SxProps<Theme>;
	time: SxProps<Theme>;
	iconBG: SxProps<Theme>;
	artist: SxProps<Theme>;
	title: SxProps<Theme>;
}

export const PGameRoundAnswerStyle = (
	answer: IGamePlayerAnswer,
	variant: "answer" | "time",
): IGameRoundAnswerStyle => {
	let bgColors = [appColors.primary[1], appColors.tertiary[1]];
	if (variant == "time") bgColors = [appColors.tertiary[1], appColors.secondary[1]];

	return {
		main: {
			py: "2px",
			px: "10px",

			position: "relative",

			flexShrink: 0,

			overflow: "hidden",
			alignItems: "center",

			background: colorGetBackground(bgColors, undefined, "linear", 305),

			borderRadius: appSharedStyle.gameRadius,
			//border: "solid 2px " + appColors.quinary[2]
			boxShadow: variant == "time" ? undefined : "0px 2px 0px 0px " + appColors.greys[1],
			mb: "5px",
		},
		message: {
			flex: 0.65,
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis",
		},
		time: {
			flex: 0.2,
		},
		iconBG: {
			position: "absolute",
			right: 0,
			top: 0,
			width: "calc(15% + 17px)",
			height: "100%",
			backgroundColor: appColors.greys[5],
		},
		artist: {
			ml: "7px",
			flex: 0.075,
			zIndex: 1,
			color: !answer.artistFound ? appColors.greys[4] : appColors.primary[0],
		},
		title: {
			flex: 0.075,
			zIndex: 1,
			color: !answer.titleFound ? appColors.greys[4] : appColors.primary[0],
		},
	};
};

//--------------------------------------------------
//                       REVEAL
//--------------------------------------------------
export interface IGameRoundRevealStyle {
	main: SxProps<Theme>;
}

export const PGameRoundRevealStyle = (): IGameRoundRevealStyle => {
	const bgColors = [appColors.primary[1], appColors.tertiary[1]];

	return {
		main: {
			mb: "10px",
			py: "15px",
			px: "20px",

			position: "relative",

			flexShrink: 0,

			overflow: "hidden",
			alignItems: "center",
			justifyContent: "center",

			background: colorGetBackground(bgColors, undefined, "linear", 305),

			borderRadius: appSharedStyle.gameRadius,
			//border: "solid 2px " + appColors.quinary[2]
		},
	};
};
