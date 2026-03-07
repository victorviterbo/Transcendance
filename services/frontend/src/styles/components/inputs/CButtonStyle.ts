import type { SxProps, Theme } from "@mui/material";
import { getBackground } from "../../../utils/styles";

const CButtonStyle: SxProps<Theme> = (theme) => ({
	background: getBackground(
		[theme.palette.primary.dark, theme.palette.primary.main],
		undefined,
		"linear",
	),
	boxShadow: "0px 5px 0px 0px " + theme.palette.primary.main,
	border: "solid 3px " + theme.palette.secondary.light,
	color: theme.palette.secondary.light,
});

export default CButtonStyle;
