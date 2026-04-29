import { Button, Chip, CircularProgress, Stack } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { ttr } from "../../localization/localization";
import {
	getRelationChipStyle,
	type RelationChipTone,
} from "../../styles/pages/profile/PProfilePublicRelationStyle";
import type {
	IRelationState,
	TConfirmableRelationAction,
	TRelationAction,
	TFriendRelation,
} from "../../types/socials";

interface RelationActionButtonProps {
	pendingAction: TRelationAction | null;
	disabled: boolean;
}

interface ConfirmableRelationActionButtonProps extends RelationActionButtonProps {
	onConfirmableAction: (action: TConfirmableRelationAction) => void;
}

interface ImmediateRelationActionButtonProps extends RelationActionButtonProps {
	onAction: (action: TRelationAction) => void;
}

interface PProfilePublicRelationActionsProps {
	relationState: IRelationState;
	pendingAction: TRelationAction | null;
	isTargetReady: boolean;
	onAction: (action: TRelationAction) => void;
	onConfirmableAction: (action: TConfirmableRelationAction) => void;
}

interface RelationStatusChipProps {
	icon: React.ReactElement;
	label: string;
	tone: RelationChipTone;
}

interface RelationChipProps {
	status: IRelationState["status"];
	relation: TFriendRelation;
}

function RelationStatusChip({ icon, label, tone }: RelationStatusChipProps) {
	return <Chip icon={icon} label={label} sx={getRelationChipStyle(tone)} />;
}

function RelationChip({ status, relation }: RelationChipProps) {
	if (status === "loading") {
		return (
			<RelationStatusChip
				icon={<CircularProgress size={16} sx={{ color: "inherit" }} />}
				label={ttr("PROFILE_SOCIAL_LOADING")}
				tone="primary"
			/>
		);
	}
	if (relation === "friends") {
		return (
			<RelationStatusChip
				icon={<CheckIcon />}
				label={ttr("PROFILE_SOCIAL_FRIEND")}
				tone="success"
			/>
		);
	}
	if (relation === "outgoing") {
		return (
			<RelationStatusChip
				icon={<HourglassEmptyIcon />}
				label={ttr("PROFILE_SOCIAL_REQUEST_SENT")}
				tone="info"
			/>
		);
	}
	if (relation === "incoming") {
		return (
			<RelationStatusChip
				icon={<HourglassEmptyIcon />}
				label={ttr("PROFILE_SOCIAL_REQUEST_RECEIVED")}
				tone="warning"
			/>
		);
	}
	return null;
}

function RemoveFriendButton({
	pendingAction,
	disabled,
	onConfirmableAction,
}: ConfirmableRelationActionButtonProps) {
	return (
		<Button
			color="error"
			variant="outlined"
			startIcon={pendingAction === "remove" ? <CircularProgress size={16} /> : <DeleteIcon />}
			disabled={disabled}
			onClick={() => onConfirmableAction("remove")}
			data-testid="PProfilePublic_RemoveFriend"
		>
			{ttr("PROFILE_SOCIAL_REMOVE_FRIEND")}
		</Button>
	);
}

function CancelFriendRequestButton({
	pendingAction,
	disabled,
	onConfirmableAction,
}: ConfirmableRelationActionButtonProps) {
	return (
		<Button
			color="warning"
			variant="outlined"
			startIcon={pendingAction === "cancel" ? <CircularProgress size={16} /> : <DeleteIcon />}
			disabled={disabled}
			onClick={() => onConfirmableAction("cancel")}
			data-testid="PProfilePublic_CancelFriendRequest"
		>
			{ttr("PROFILE_SOCIAL_CANCEL_REQUEST")}
		</Button>
	);
}

function IncomingFriendRequestActions({
	pendingAction,
	disabled,
	onAction,
}: ImmediateRelationActionButtonProps) {
	return (
		<Stack direction="row" spacing={1}>
			<Button
				color="success"
				variant="contained"
				startIcon={
					pendingAction === "accept" ? <CircularProgress size={16} /> : <CheckIcon />
				}
				disabled={disabled}
				onClick={() => onAction("accept")}
				data-testid="PProfilePublic_AcceptFriend"
			>
				{ttr("PROFILE_SOCIAL_ACCEPT")}
			</Button>
			<Button
				color="error"
				variant="outlined"
				disabled={disabled}
				onClick={() => onAction("refuse")}
				data-testid="PProfilePublic_RefuseFriend"
			>
				{ttr("PROFILE_SOCIAL_REFUSE")}
			</Button>
		</Stack>
	);
}

function AddFriendButton({
	pendingAction,
	disabled,
	onAction,
}: ImmediateRelationActionButtonProps) {
	return (
		<Button
			variant="contained"
			startIcon={
				pendingAction === "send" ? <CircularProgress size={16} /> : <PersonAddIcon />
			}
			disabled={disabled}
			onClick={() => onAction("send")}
			data-testid="PProfilePublic_AddFriend"
		>
			{ttr("PROFILE_SOCIAL_ADD_FRIEND")}
		</Button>
	);
}

function RelationAction({
	relation,
	pendingAction,
	disabled,
	onAction,
	onConfirmableAction,
}: {
	relation: TFriendRelation;
	pendingAction: TRelationAction | null;
	disabled: boolean;
	onAction: (action: TRelationAction) => void;
	onConfirmableAction: (action: TConfirmableRelationAction) => void;
}) {
	if (relation === "friends") {
		return (
			<RemoveFriendButton
				pendingAction={pendingAction}
				disabled={disabled}
				onConfirmableAction={onConfirmableAction}
			/>
		);
	}
	if (relation === "outgoing") {
		return (
			<CancelFriendRequestButton
				pendingAction={pendingAction}
				disabled={disabled}
				onConfirmableAction={onConfirmableAction}
			/>
		);
	}
	if (relation === "incoming") {
		return (
			<IncomingFriendRequestActions
				pendingAction={pendingAction}
				disabled={disabled}
				onAction={onAction}
			/>
		);
	}
	if (relation === "not-friends") {
		return (
			<AddFriendButton
				pendingAction={pendingAction}
				disabled={disabled}
				onAction={onAction}
			/>
		);
	}
	return null;
}

function PProfilePublicRelationActions({
	relationState,
	pendingAction,
	isTargetReady,
	onAction,
	onConfirmableAction,
}: PProfilePublicRelationActionsProps) {
	const disabled = relationState.status === "loading" || pendingAction !== null || !isTargetReady;

	return (
		<Stack
			direction={{ xs: "column", sm: "row" }}
			spacing={1}
			alignItems={{ xs: "stretch", sm: "center" }}
		>
			<RelationChip status={relationState.status} relation={relationState.relation} />
			<RelationAction
				relation={relationState.relation}
				pendingAction={pendingAction}
				disabled={disabled}
				onAction={onAction}
				onConfirmableAction={onConfirmableAction}
			/>
		</Stack>
	);
}

export default PProfilePublicRelationActions;
