import type { SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";
import { colorGetBackground } from "../../../utils/styles";

export const PGameLBoardNodeStyle = (position: number) => {

	let bgColors: string[] = [];
	if(position < 3)
		bgColors = [appColors.secondary[0], appColors.secondary[1]];
	else
		bgColors = [appColors.primary[0], appColors.quinary[0]];
	
	return {
		background: colorGetBackground([bgColors[0], bgColors[1]], undefined, "linear", 160),
		alignItems: "center",
		p: "10px",
		mb: "5px",
		borderRadius: appSharedStyle.gameRadius
	}
}

export const PGameLBoardNodeUsernameStyle: SxProps<Theme> = (_) => ({
	flex: 1,
	ml: "15px" 
})

export const PGameLBoardNodePtsStyle: SxProps<Theme> = (_) => ({
	mr: "15px" 
})