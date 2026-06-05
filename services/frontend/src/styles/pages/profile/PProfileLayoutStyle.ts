import type { SxProps, Theme } from "@mui/material";

export interface IProfileLayoutStyle {
	tabContent: SxProps<Theme>;
}

export const PProfileLayoutStyle = (): IProfileLayoutStyle => ({
	tabContent: {
		width: "100%",
		maxWidth: "860px",
		mx: "auto",
	},
});
