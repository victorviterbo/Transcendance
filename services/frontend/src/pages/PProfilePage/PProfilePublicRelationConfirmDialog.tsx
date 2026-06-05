import { DialogActions, Stack } from "@mui/material";
import CDialog from "../../components/feedback/dialogs/CDialog";
import CDialogTitle from "../../components/feedback/dialogs/CDialogTitle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import CText from "../../components/text/CText";
import type { TConfirmableRelationAction, TRelationAction } from "../../types/socials";

interface PProfilePublicRelationConfirmDialogProps {
	action: TConfirmableRelationAction | null;
	pendingAction: TRelationAction | null;
	onClose: () => void;
	onConfirm: () => void;
}

function PProfilePublicRelationConfirmDialog({
	action,
	pendingAction,
	onClose,
	onConfirm,
}: PProfilePublicRelationConfirmDialogProps) {
	const isCancelRequest = action === "cancel";
	const isPending = pendingAction !== null;

	return (
		<CDialog
			open={action !== null}
			onClose={() => {
				if (!isPending) onClose();
			}}
		>
			<Stack spacing={2} alignItems="center" sx={{ pt: 1, minWidth: { xs: 0, sm: 360 } }}>
				<CDialogTitle>
					{isCancelRequest
						? "PROFILE_SOCIAL_CANCEL_REQUEST_TITLE"
						: "PROFILE_SOCIAL_REMOVE_FRIEND_TITLE"}
				</CDialogTitle>
				<CText align="center">
					{isCancelRequest
						? "PROFILE_SOCIAL_CANCEL_REQUEST_CONFIRMATION"
						: "PROFILE_SOCIAL_REMOVE_FRIEND_CONFIRMATION"}
				</CText>
				<DialogActions sx={{ px: 0, pb: 0, pt: 1 }}>
					<CButtonText onClick={onClose} disabled={isPending}>
						{isCancelRequest
							? "PROFILE_SOCIAL_CANCEL_REQUEST_CANCEL"
							: "PROFILE_SOCIAL_REMOVE_FRIEND_CANCEL"}
					</CButtonText>
					<CButtonText onClick={onConfirm} disabled={isPending}>
						{isPending
							? "PROFILE_SOCIAL_LOADING"
							: isCancelRequest
								? "PROFILE_SOCIAL_CANCEL_REQUEST"
								: "PROFILE_SOCIAL_REMOVE_FRIEND"}
					</CButtonText>
				</DialogActions>
			</Stack>
		</CDialog>
	);
}

export default PProfilePublicRelationConfirmDialog;
