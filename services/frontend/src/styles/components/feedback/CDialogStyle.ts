import type { SxProps, Theme } from "@mui/material";
import { appSharedStyle } from "../../theme";

export const CDialogStyle: SxProps<Theme> = (_) => ({});

export const CDialogContentStyle: SxProps<Theme> = (_) => ({
	background: appSharedStyle.bg.feedback,
	border: "solid 4px white",
	borderRadius: appSharedStyle.radius + "px",
});
