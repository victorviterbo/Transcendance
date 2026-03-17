import { Dialog, DialogContent, type DialogProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import {
	CDialogContentStyle,
	CDialogStyle,
} from "../../../styles/components/feedback/CDialogStyle";

export interface CDialogProps extends GCompProps, DialogProps {}

function CDialog({ sx, children, ...other }: CDialogProps) {
	return (
		<Dialog sx={[CDialogStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...other}>
			<DialogContent sx={CDialogContentStyle}>{children}</DialogContent>
		</Dialog>
	);
}

export default CDialog;
