import type { SxProps, Theme } from "@mui/material";
import { appSharedStyle } from "../../theme";

const CBasePaperStyle: SxProps<Theme> = (_theme) => ({
	background: appSharedStyle.bg.paper,
	backgroundColor: null,
	boxShadow: "0px 7px 0px 0px #000000", // + theme.palette.primary.dark,
	//border: "solid 5px #fff",
	p: 4,
});

export default CBasePaperStyle;
