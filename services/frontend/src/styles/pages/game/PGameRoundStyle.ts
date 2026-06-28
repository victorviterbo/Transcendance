import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import type { IGameRound, IGameSettings } from "../../../types/game";
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
			mt: { xs: "0px", md: "15px" },
			mr: "5px",
			flex: { xs: 0.25, md: 0 },
			minWidth: "155px",
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
			justifyContent: "space-around",
		},
		pointBoxPointList: {
			flex: 1,
			backgroundColor: appColors.greys[6],
			justifyContent: "space-around",
			pl: "7px",
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
		else if (round.artistFound || round.titleFound) bgColor = appColors.secondary[0];
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

			transform: "translateY(5px)",
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
			mb: { xs: "0px", md: "10px" },
			mt: { xs: "10px", sm: "0px" },
			mr: { xs: "0px", sm: "10px", md: "0px" },
			py: "15px",
			px: "20px",

			position: "relative",

			flexShrink: 0,
			flex: 1,

			overflow: "hidden",
			alignItems: "center",
			justifyContent: "center",

			background: colorGetBackground(bgColors, undefined, "linear", 305),

			borderRadius: appSharedStyle.gameRadius,
			//border: "solid 2px " + appColors.quinary[2]
		},
	};
};

//--------------------------------------------------
//                       ENDED
//--------------------------------------------------
export interface IGameRoundEndedStyle {
	box: SxProps<Theme>;
	bottom: SxProps<Theme>;
}

export const PGameRoundEndedStyle = (): IGameRoundEndedStyle => {
	return {
		box: {
			px: "15px",
			py: "10px",

			mx: "5px",

			backgroundColor: appColors.greys[6],
			borderRadius: appSharedStyle.gameRadius,
		},
		bottom: {
			backgroundColor: appColors.greys[7],
			ml: "-5px",
			mr: "-5px",
			mb: "-5px",
			pt: "7px",
			pb: "12px",
			justifyContent: "center",
			boxShadow: "0px -2px 10px 0px " + appColors.greys[9],
			zIndex: 1,
		},
	};
};

export interface IGameEndedRecapStyle {
	card: SxProps<Theme>;
	iconBox: SxProps<Theme>;
	icon: SxProps<Theme>;
	split: SxProps<Theme>;
	dataStack: SxProps<Theme>;
	valueText: SxProps<Theme>;
}

export const PGameEndedRecapStyle = (): IGameEndedRecapStyle => {
	return {
		card: {
			flex: 1,
			my: { xs: "5px", sm: "0px" },
			mx: "10px",
			px: "5px",
			pt: { xs: "3px", sm: "0px" },
			pb: { xs: "3px", sm: "10px" },
			borderRadius: appSharedStyle.gameRadius,
			border: "solid 2px " + appColors.primary[1],
			background: colorGetBackground(
				[appColors.quaternary[2], appColors.primary[1]],
				undefined,
				"linear",
				15,
			),
		},
		iconBox: {
			my: "10px",
			p: "5px",
			borderRadius: appSharedStyle.smallGameRadius,
			border: "outset 3px " + appColors.secondary[0],
			background: colorGetBackground(
				[appColors.greys[8], appColors.greys[5]],
				undefined,
				"linear",
				15 + 180,
			),
		},
		icon: {
			color: appColors.secondary[0],
		},
		split: {
			width: "3px",
			my: "7px",
			backgroundColor: appColors.secondary[0],
		},
		dataStack: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
		},
		valueText: {
			m: 0,
		},
	};
};

export interface IGameRoundEndedNodeStyle {
	main: SxProps<Theme>;
	dataStack: SxProps<Theme>;
	rankingColor: string;
	rankingText: SxProps<Theme>;
	timeColor: string;
	timeText: SxProps<Theme>;
	artist: SxProps<Theme>;
	title: SxProps<Theme>;
}

export const PGameRoundEndedNodeStyle = (
	round: IGameRound,
	settings: IGameSettings,
): IGameRoundEndedNodeStyle => {
	let bgColors = [appColors.greys[8], appColors.greys[5]];
	if (round.artistFound !== round.titleFound)
		bgColors = [appColors.tertiary[1], appColors.secondary[1]];
	if (round.artistFound && round.titleFound)
		bgColors = [appColors.primary[1], appColors.tertiary[1]];

	const rankingColor: string =
		settings && round.ranking > 3 ? appColors.primary[0] : appColors.secondary[0];
	const timeColor: string =
		round.time < 0 || (settings && round.time >= settings.playbackDuration)
			? appColors.greys[4]
			: rankingColor;

	return {
		main: {
			py: "0px",
			pl: { xs: "0px", sm: "10px" },

			position: "relative",

			flexShrink: 0,

			overflow: "hidden",
			alignItems: "stretch",

			background: colorGetBackground(bgColors, undefined, "linear", 305),

			borderRadius: appSharedStyle.gameRadius,
			//border: "solid 2px " + appColors.quinary[2]
			//boxShadow: "0px 4px 0px 0px " + appColors.greys[0],
			mb: "10px",
		},
		dataStack: {
			mt: { xs: "5px", sm: "0px" },
			py: "5px",
			alignItems: "center",
			backgroundColor: appColors.greys[5],
			boxShadow: "-1px 0px 5px 0px " + appColors.greys[9],
		},
		rankingColor,
		rankingText: {
			mr: "15px",
			ml: "2px",
			my: 0,
			width: "20px",
		},
		timeColor,
		timeText: {
			mr: "15px",
			ml: "2px",
			my: 0,
			width: "50px",

			color:
				round.time < 0 || (settings && round.time >= settings.playbackDuration)
					? timeColor
					: undefined,
		},
		artist: {
			mr: "5px",
			color: !round.artistFound ? appColors.greys[4] : rankingColor,
		},
		title: {
			mr: "10px",
			color: !round.titleFound ? appColors.greys[4] : rankingColor,
		},
	};
};
