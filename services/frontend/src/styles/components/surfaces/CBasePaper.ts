import type { SxProps, Theme } from "@mui/material";

const CBasePaperStyle: SxProps<Theme> = (theme) => ({
	backgroundColor: theme.palette.background.paper,

	mt: 8,
	p: 4,
	borderRadius: (theme.shape.borderRadius as number) * 2,
});

export default CBasePaperStyle;
