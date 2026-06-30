import { Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/auth/CAuthProvider";
import {
	removeFriend,
	hasSocialErrorCode,
	respondFriendRequest,
	searchFriends,
	sendFriendRequest,
} from "../../api/social";
import type { IProfileData } from "../../types/profile";
import type { IExtUserInfo } from "../../types/user";
import { getErrorMessage } from "../../utils/error";
import PProfilePublicRelationActions from "./PProfilePublicRelationActions";
import PProfilePublicRelationConfirmDialog from "./PProfilePublicRelationConfirmDialog";
import type {
	IRelationState,
	TConfirmableRelationAction,
	TRelationAction,
} from "../../types/socials";
import { useNotif } from "../../components/contexts/CAppNotifContext";

interface PProfilePublicRelationProps {
	profile: IProfileData;
	onProfileMissing?: () => void;
}

const getTargetUser = (profile: IProfileData): IExtUserInfo => ({
	uid: profile.uid ?? "",
	username: profile.username,
	avatar: profile.avatar ?? "",
	badges: profile.badges,
	relation: "not-friends",
});

const findExactRelation = (users: IExtUserInfo[], profile: IProfileData) => {
	return users.find((user) => {
		return user.uid === profile.uid || user.username === profile.username;
	});
};

function PProfilePublicRelation({ profile, onProfileMissing }: PProfilePublicRelationProps) {
	const { status: authStatus } = useAuth();
	const [relationState, setRelationState] = useState<IRelationState>({
		status: "idle",
		relation: "not-friends",
		error: null,
	});
	const [pendingAction, setPendingAction] = useState<TRelationAction | null>(null);
	const [confirmAction, setConfirmAction] = useState<TConfirmableRelationAction | null>(null);
	const targetUser = useMemo(() => {
		return getTargetUser(profile);
	}, [profile]);
	const pushNotif = useNotif().push;

	useEffect(() => {
		if (authStatus !== "authed") {
			setRelationState({
				status: "loading",
				relation: "not-friends",
				error: null,
			});
			return;
		}

		let ignore = false;
		setRelationState((current) => ({ ...current, status: "loading", error: null }));

		void searchFriends(profile.username)
			.then((response) => {
				if (ignore) return;
				const exactUser = findExactRelation(response.users, profile);
				setRelationState({
					status: "ready",
					relation: exactUser?.relation ?? "not-friends",
					error: null,
				});
			})
			.catch((relationError) => {
				if (ignore) return;
				setRelationState({
					status: "error",
					relation: "not-friends",
					error: getErrorMessage(relationError, "PROFILE_SOCIAL_RELATION_FAILED"),
				});
			});

		return () => {
			ignore = true;
		};
	}, [authStatus, profile]);

	useEffect(() => {
		if (!relationState.error) return;
		pushNotif({
			severity: "error",
			message: relationState.error,
		});
		const clear = async () => {
			relationState.error = null;
			setRelationState(structuredClone(relationState));
		};
		clear();
	}, [relationState, setRelationState, pushNotif]);

	const handleSocialAction = async (action: TRelationAction) => {
		setPendingAction(action);
		setRelationState((current) => ({ ...current, error: null }));
		try {
			if (action === "send") {
				await sendFriendRequest(targetUser);
				setRelationState({ status: "ready", relation: "outgoing", error: null });
			} else if (action === "remove" || action === "cancel") {
				await removeFriend(targetUser);
				setRelationState({ status: "ready", relation: "not-friends", error: null });
			} else {
				await respondFriendRequest(targetUser, action);
				setRelationState({
					status: "ready",
					relation: action === "accept" ? "friends" : "not-friends",
					error: null,
				});
			}
		} catch (actionError) {
			if (action === "send" && hasSocialErrorCode(actionError, "FRIENDSHIP_ALREADY_EXISTS")) {
				const response = await searchFriends(profile.username);
				const exactUser = findExactRelation(response.users, profile);
				if (exactUser?.relation === "incoming") {
					await respondFriendRequest(targetUser, "accept");
					setRelationState({ status: "ready", relation: "friends", error: null });
				} else {
					setRelationState({
						status: "ready",
						relation: exactUser?.relation ?? "friends",
						error: null,
					});
				}
				return;
			}
			if (hasSocialErrorCode(actionError, "USER_NOT_FOUND")) {
				onProfileMissing?.();
				return;
			}
			if (action !== "send" && hasSocialErrorCode(actionError, "FRIENDSHIP_NOT_FOUND")) {
				setRelationState({
					status: "ready",
					relation: "not-friends",
					error: action === "accept" ? "PROFILE_SOCIAL_REQUEST_EXPIRED" : null,
				});
				return;
			}
			setRelationState((current) => ({
				...current,
				error: getErrorMessage(actionError, "PROFILE_SOCIAL_ACTION_FAILED"),
			}));
		} finally {
			setPendingAction(null);
		}
	};

	const handleConfirmAction = async () => {
		if (!confirmAction) return;
		const action = confirmAction;
		setConfirmAction(null);
		await handleSocialAction(action);
	};

	return (
		<Stack
			spacing={1}
			alignItems={{ xs: "stretch", sm: "flex-end" }}
			sx={{ width: { xs: "100%", sm: "auto" } }}
		>
			<PProfilePublicRelationActions
				relationState={relationState}
				pendingAction={pendingAction}
				isTargetReady={targetUser.uid.length > 0}
				onAction={(action) => void handleSocialAction(action)}
				onConfirmableAction={setConfirmAction}
			/>
			<PProfilePublicRelationConfirmDialog
				action={confirmAction}
				pendingAction={pendingAction}
				onClose={() => setConfirmAction(null)}
				onConfirm={() => void handleConfirmAction()}
			/>
		</Stack>
	);
}

export default PProfilePublicRelation;
