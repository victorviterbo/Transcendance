import type { SxProps, Theme } from "@mui/material";
import { colorAlterColor, colorGetBackground } from "../../../utils/styles";
import { appColors } from "../../theme";

const CButtonStyle: SxProps<Theme> = (theme) => ({
	background: colorGetBackground(
		[appColors.tertiary[0], colorAlterColor(appColors.tertiary[2], "shift-brightness", -0.1)],
		undefined,
		"radial",
	),
	boxShadow: "0px 5px 0px 0px " + appColors.greys[0],
	//border: "solid 3px " + theme.palette.secondary.light,
	color: theme.palette.grey[100],
});

export default CButtonStyle;
