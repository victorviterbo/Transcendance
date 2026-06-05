import { Button, Chip, CircularProgress, Stack } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { ttr } from "../../localization/localization";
import {
	PProfilePublicRelationStyle,
	type IProfilePublicRelationStyle,
	type RelationChipTone,
} from "../../styles/pages/profile/PProfilePublicRelationStyle";
import { useMemo } from "react";
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
	style: IProfilePublicRelationStyle;
}

interface ImmediateRelationActionButtonProps extends RelationActionButtonProps {
	onAction: (action: TRelationAction) => void;
	style: IProfilePublicRelationStyle;
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
	style: IProfilePublicRelationStyle;
	tone: RelationChipTone;
}

interface RelationChipProps {
	status: IRelationState["status"];
	relation: TFriendRelation;
	style: IProfilePublicRelationStyle;
}

function RelationStatusChip({ icon, label, style, tone }: RelationStatusChipProps) {
	return <Chip icon={icon} label={label} sx={style.relationChip(tone)} />;
}

function RelationChip({ status, relation, style }: RelationChipProps) {
	if (status === "loading") {
		return (
			<RelationStatusChip
				icon={<CircularProgress size={16} sx={{ color: "inherit" }} />}
				label={ttr("PROFILE_SOCIAL_LOADING")}
				style={style}
				tone="loading"
			/>
		);
	}
	if (relation === "friends") {
		return (
			<RelationStatusChip
				icon={<CheckIcon />}
				label={ttr("PROFILE_SOCIAL_FRIEND")}
				style={style}
				tone="success"
			/>
		);
	}
	if (relation === "outgoing") {
		return (
			<RelationStatusChip
				icon={<HourglassEmptyIcon />}
				label={ttr("PROFILE_SOCIAL_REQUEST_SENT")}
				style={style}
				tone="info"
			/>
		);
	}
	if (relation === "incoming") {
		return null;
	}
	return null;
}

function RemoveFriendButton({
	pendingAction,
	disabled,
	onConfirmableAction,
	style,
}: ConfirmableRelationActionButtonProps) {
	return (
		<Button
			{...style.dangerButton}
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
	style,
}: ConfirmableRelationActionButtonProps) {
	return (
		<Button
			{...style.dangerButton}
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
	style,
}: ImmediateRelationActionButtonProps) {
	return (
		<Stack direction="row" spacing={1}>
			<Button
				{...style.successButton}
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
				{...style.dangerButton}
				startIcon={
					pendingAction === "refuse" ? <CircularProgress size={16} /> : <CloseIcon />
				}
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
	style: _style,
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
	style,
}: {
	relation: TFriendRelation;
	pendingAction: TRelationAction | null;
	disabled: boolean;
	onAction: (action: TRelationAction) => void;
	onConfirmableAction: (action: TConfirmableRelationAction) => void;
	style: IProfilePublicRelationStyle;
}) {
	if (relation === "friends") {
		return (
			<RemoveFriendButton
				pendingAction={pendingAction}
				disabled={disabled}
				onConfirmableAction={onConfirmableAction}
				style={style}
			/>
		);
	}
	if (relation === "outgoing") {
		return (
			<CancelFriendRequestButton
				pendingAction={pendingAction}
				disabled={disabled}
				onConfirmableAction={onConfirmableAction}
				style={style}
			/>
		);
	}
	if (relation === "incoming") {
		return (
			<IncomingFriendRequestActions
				pendingAction={pendingAction}
				disabled={disabled}
				onAction={onAction}
				style={style}
			/>
		);
	}
	if (relation === "not-friends") {
		return (
			<AddFriendButton
				pendingAction={pendingAction}
				disabled={disabled}
				onAction={onAction}
				style={style}
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
	const style: IProfilePublicRelationStyle = useMemo(() => {
		return PProfilePublicRelationStyle();
	}, []);

	return (
		<Stack
			direction={{ xs: "column", sm: "row" }}
			spacing={1}
			alignItems={{ xs: "stretch", sm: "center" }}
		>
			<RelationChip
				status={relationState.status}
				relation={relationState.relation}
				style={style}
			/>
			<RelationAction
				relation={relationState.relation}
				pendingAction={pendingAction}
				disabled={disabled}
				onAction={onAction}
				onConfirmableAction={onConfirmableAction}
				style={style}
			/>
		</Stack>
	);
}

export default PProfilePublicRelationActions;
