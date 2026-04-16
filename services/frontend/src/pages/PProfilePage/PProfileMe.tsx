import { Container, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import CTabs from "../../components/navigation/CTabs";
import { useAuth } from "../../components/auth/CAuthProvider";
import ProfileMatchHistoryPanel from "./PProfileMatchHistoryPanel";
import ProfileModifyMePanel from "./PProfileSettingsPanel";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";
import { getErrorMessage } from "../../utils/error";
import PProfileAvatarEditor from "./PProfileAvatarEditor";
import CLevelProgress from "../../components/feedback/CLevelProgress";
import CProfileRequestState from "../../components/feedback/CProfileRequestState";
import { fetchProfile, getProfileLevelProgress } from "../../api/profile";
import { type IProfileData } from "../../types/profile";

type ProfileStatus = "idle" | "loading" | "ready" | "error";

interface ProfileState {
	username: string;
	status: ProfileStatus;
	profile: IProfileData | null;
	error: string | null;
}

interface ProfileInfoProps {
	profile: IProfileData;
	onAvatarUploaded: (nextProfile: IProfileData) => void;
}

const ProfileInfo = ({ profile, onAvatarUploaded }: ProfileInfoProps) => {
	const displayUsername = profile.username;
	const xp = profile.exp_points ?? 0;
	const badge = profile.badges;
	const levelProgress = getProfileLevelProgress(xp);

	return (
		<CBasePaper sx={{ p: 2 }}>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={2}
				alignItems={{ xs: "flex-start", sm: "center" }}
			>
				<PProfileAvatarEditor
					username={displayUsername}
					avatar={profile.avatar}
					onUploaded={onAvatarUploaded}
				/>
				<Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
					<CTitle size="md">{displayUsername}</CTitle>
					<CLevelProgress
						level={levelProgress.level}
						progressPercent={levelProgress.progressPercent}
						title={badge}
					/>
				</Stack>
			</Stack>
		</CBasePaper>
	);
};

const PProfileMe = () => {
	const { user } = useAuth();
	const [profileState, setProfileState] = useState<ProfileState>({
		username: "",
		status: "idle",
		profile: null,
		error: null,
	});
	const setReadyProfile = (nextProfile: IProfileData) => {
		setProfileState({
			username: nextProfile.username,
			status: "ready",
			profile: nextProfile,
			error: null,
		});
	};
	const username = user?.username ?? "";
	const hasReadyProfile = profileState.status === "ready" && profileState.profile !== null;
	const isCurrentUsername = profileState.username === username;
	const profile = hasReadyProfile ? profileState.profile : null;
	const error = isCurrentUsername ? profileState.error : null;
	const status: ProfileStatus = !username
		? "loading"
		: hasReadyProfile
			? "ready"
			: isCurrentUsername
				? profileState.status
				: "loading";

	useEffect(() => {
		if (!username) return;

		let ignore = false;
		void fetchProfile(username)
			.then((nextProfile) => {
				if (ignore) return;
				setProfileState({
					username,
					status: "ready",
					profile: nextProfile,
					error: null,
				});
			})
			.catch((profileError) => {
				if (ignore) return;
				setProfileState({
					username,
					status: "error",
					profile: null,
					error: getErrorMessage(profileError, "PROFILE_LOAD_FAILED"),
				});
			});

		return () => {
			ignore = true;
		};
	}, [username]);

	if (status !== "ready" || profile === null) {
		return (
			<GPageBase>
				<CProfileRequestState
					status={status === "error" ? "error" : "loading"}
					error={error}
				/>
			</GPageBase>
		);
	}

	return (
		<GPageBase>
			<Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
				<Stack spacing={3}>
					<ProfileInfo profile={profile} onAvatarUploaded={setReadyProfile} />

					<CBasePaper>
						<CTabs tabs={["STATISTICS", "MATCH_HISTORY", "PROFILE_SETTINGS"]}>
							<ProfileStatisticsPanel scope="me" />
							<ProfileMatchHistoryPanel scope="me" />
							<ProfileModifyMePanel
								username={user?.username}
								onProfileUpdated={setReadyProfile}
							/>
						</CTabs>
					</CBasePaper>
				</Stack>
			</Container>
		</GPageBase>
	);
};

export default PProfileMe;
