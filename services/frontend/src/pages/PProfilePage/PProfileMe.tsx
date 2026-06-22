import { Box, Container, Stack } from "@mui/material";
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
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "minmax(0, 1fr) minmax(260px, 400px)",
					},
					gap: 3,
					alignItems: "center",
				}}
			>
				<Stack direction="row" spacing={2.5} alignItems="center" sx={{ minWidth: 0 }}>
					<PProfileAvatarEditor
						username={displayUsername}
						avatar={profile.avatar}
						onUploaded={onAvatarUploaded}
					/>
					<CTitle
						noTr={true}
						size="md"
						sx={{ minWidth: 0, mb: 0, overflowWrap: "anywhere" }}
					>
						{displayUsername}
					</CTitle>
				</Stack>
				<Box
					sx={{
						width: "100%",
						maxWidth: 400,
						justifySelf: { xs: "stretch", sm: "end" },
					}}
				>
					<CLevelProgress
						level={levelProgress.level}
						progressPercent={levelProgress.progressPercent}
						title={badge}
					/>
				</Box>
			</Box>
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
							<ProfileStatisticsPanel username={profile.username} />
							<ProfileMatchHistoryPanel />
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
