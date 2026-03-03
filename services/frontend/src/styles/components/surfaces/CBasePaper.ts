import type { SxProps, Theme } from "@mui/material";

const CBasePaperStyle: SxProps<Theme> = (theme) => ({
	backgroundColor: theme.palette.background.paper,

	mt: 8,
	p: 4,
});

export default CBasePaperStyle;
