import { DialogActions, Stack } from "@mui/material";
import CDialog from "../../components/feedback/dialogs/CDialog";
import CDialogTitle from "../../components/feedback/dialogs/CDialogTitle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import CText from "../../components/text/CText";

interface PGameInteractDialogProps {
	open: boolean;
	onInteract: () => void;
}

function PGameInteractDialog({ open, onInteract }: PGameInteractDialogProps) {
	return (
		<CDialog open={open}>
			<Stack spacing={2} alignItems="center" sx={{ pt: 1, minWidth: { xs: 0, sm: 360 } }}>
				<CDialogTitle>GAME_LEAVE_INTERACT_TITLE</CDialogTitle>
				<CText align="center">GAME_LEAVE_INTERACT_MESSAGE</CText>
				<DialogActions sx={{ px: 0, pb: 0, pt: 1 }}>
					<CButtonText onClick={onInteract}>GAME_LEAVE_INTERACT_BUTTON</CButtonText>
				</DialogActions>
			</Stack>
		</CDialog>
	);
}

export default PGameInteractDialog;
