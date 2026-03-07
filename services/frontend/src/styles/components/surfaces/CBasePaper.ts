import type { SxProps, Theme } from "@mui/material";

const CBasePaperStyle: SxProps<Theme> = (theme) => ({
	background: theme.palette.background.paper,
	backgroundColor: null,
	boxShadow: "0px 7px 0px 0px #000000", // + theme.palette.primary.dark,

	p: 4,
});

export default CBasePaperStyle;
