import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import { colorAlterColor, colorGetBackground } from "../../../utils/styles";

export const PGameLBoardNodeStyle = (position: number, self: boolean) => {
	let bgColors: string[] = [];
	if (position < 3)
		bgColors = [
			colorAlterColor(appColors.secondary[0], "shift-hue", -5 * position),
			colorAlterColor(appColors.secondary[0], "shift-hue", -5 * position - 15),
		];
	else bgColors = [appColors.primary[0], appColors.quinary[0]];

	return {
		background: colorGetBackground([bgColors[0], bgColors[1]], undefined, "linear", 160),
		border: self ? "outset  6px " + appColors.tertiary[0] : undefined,
		alignItems: "center",
		p: "10px",
		mb: "5px",
		borderRadius: appSharedStyle.gameRadius,
	};
};

export const PGameLBoardNodeUsernameStyle: SxProps<Theme> = (_) => ({
	flex: 1,
	ml: "15px",
});

export const PGameLBoardNodePtsStyle: SxProps<Theme> = (_) => ({
	mr: "15px",
});

export const PGameLBoardNodePosStyle: SxProps<Theme> = (_) => ({
	mr: "15px",
	minWidth: "30px",
});
