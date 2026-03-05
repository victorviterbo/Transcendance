import type { SxProps, Theme } from "@mui/material";

const CButtonStyle: SxProps<Theme> = (theme) => ({
	backgroundColor: theme.palette.background.paper,
	boxShadow: "0px 5px 0px 2px black",
});

export default CButtonStyle;
