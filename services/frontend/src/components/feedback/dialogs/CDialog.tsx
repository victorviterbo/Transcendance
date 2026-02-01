import { Dialog, type DialogProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";

export interface CDialogProps extends GCompProps, DialogProps {

}

function CDialog({...other}: CDialogProps) {
	return <Dialog {...other}>

	</Dialog>
}

export default CDialog;