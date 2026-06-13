import { DialogActions, Stack } from "@mui/material";
import CDialog from "../../components/feedback/dialogs/CDialog";
import CDialogTitle from "../../components/feedback/dialogs/CDialogTitle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import CText from "../../components/text/CText";

interface PGameLeaveConfirmDialogProps {
	open: boolean;
	onStay: () => void;
	onLeave: () => void;
}

function PGameLeaveConfirmDialog({ open, onStay, onLeave }: PGameLeaveConfirmDialogProps) {
	return (
		<CDialog open={open} onClose={onStay}>
			<Stack spacing={2} alignItems="center" sx={{ pt: 1, minWidth: { xs: 0, sm: 360 } }}>
				<CDialogTitle>GAME_LEAVE_CONFIRM_TITLE</CDialogTitle>
				<CText align="center">GAME_LEAVE_CONFIRM_MESSAGE</CText>
				<DialogActions sx={{ px: 0, pb: 0, pt: 1 }}>
					<CButtonText onClick={onStay}>GAME_LEAVE_STAY</CButtonText>
					<CButtonText onClick={onLeave}>GAME_LEAVE_CONFIRM</CButtonText>
				</DialogActions>
			</Stack>
		</CDialog>
	);
}

export default PGameLeaveConfirmDialog;
