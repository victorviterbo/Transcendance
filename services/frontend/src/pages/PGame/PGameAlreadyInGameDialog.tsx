import { DialogActions, Stack } from "@mui/material";
import CDialog from "../../components/feedback/dialogs/CDialog";
import CDialogTitle from "../../components/feedback/dialogs/CDialogTitle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import CText from "../../components/text/CText";

interface PGameAlreadyInGameDialogProps {
	open: boolean;
	onReturnToCurrentGame: () => void;
	onJoinNewGame: () => void;
}

function PGameAlreadyInGameDialog({
	open,
	onReturnToCurrentGame,
	onJoinNewGame,
}: PGameAlreadyInGameDialogProps) {
	return (
		<CDialog open={open} onClose={onReturnToCurrentGame}>
			<Stack spacing={2} alignItems="center" sx={{ pt: 1, minWidth: { xs: 0, sm: 360 } }}>
				<CDialogTitle>GAME_ALREADY_IN_GAME_TITLE</CDialogTitle>
				<CText align="center">GAME_ALREADY_IN_GAME_MESSAGE</CText>
				<DialogActions sx={{ px: 0, pb: 0, pt: 1 }}>
					<CButtonText onClick={onReturnToCurrentGame}>
						GAME_ALREADY_IN_GAME_RETURN
					</CButtonText>
					<CButtonText onClick={onJoinNewGame}>GAME_ALREADY_IN_GAME_JOIN</CButtonText>
				</DialogActions>
			</Stack>
		</CDialog>
	);
}

export default PGameAlreadyInGameDialog;
