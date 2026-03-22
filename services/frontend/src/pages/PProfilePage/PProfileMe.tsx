import { Container, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import CTabs from "../../components/navigation/CTabs";
import { useAuth } from "../../components/auth/CAuthProvider";
import ProfileMatchHistoryPanel from "./PProfileMatchHistoryPanel";
import ProfileModifyMePanel from "./PProfileSettingsPanel";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";
import { getErrorMessage } from "../../utils/error";
import PProfileAvatarEditor from "./PProfileAvatarEditor";
import { fetchProfile } from "../../api/profile";
import { type IProfileData } from "../../types/profile";

interface ProfileState {
	username: string;
	profile: IProfileData | null;
	error: string | null;
}

interface ProfileInfoProps {
	username: string;
	profile: IProfileData | null;
	error: string | null;
	onAvatarUploaded: (nextProfile: IProfileData) => void;
}

const ProfileInfo = ({ username, profile, error, onAvatarUploaded }: ProfileInfoProps) => {
	const displayUsername = profile?.username ?? username;
	const xp = profile?.exp_points ?? 0;
	const badge = profile?.badges ?? "Unknown";

	return (
		<CBasePaper sx={{ p: 2 }}>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={2}
				alignItems={{ xs: "flex-start", sm: "center" }}
			>
				<PProfileAvatarEditor
					username={displayUsername}
					image={profile?.image}
					onUploaded={onAvatarUploaded}
				/>
				<Stack>
					<CTitle size="md">{displayUsername}</CTitle>
					<CText size="sm">Badge: {badge}</CText>
					<CText size="sm">XP: {xp}</CText>
					{error && (
						<CText size="sm" color="error">
							{error}
						</CText>
					)}
				</Stack>
			</Stack>
		</CBasePaper>
	);
};

const PProfileMe = () => {
	const { user } = useAuth();
	const [profileState, setProfileState] = useState<ProfileState>({
		username: "",
		profile: null,
		error: null,
	});
	const username = user?.username ?? "";
	const profile = profileState.username === username ? profileState.profile : null;
	const error = profileState.username === username ? profileState.error : null;

	useEffect(() => {
		if (!username) return;

		let ignore = false;
		void fetchProfile(username)
			.then((nextProfile) => {
				if (ignore) return;
				setProfileState({
					username,
					profile: nextProfile,
					error: null,
				});
			})
			.catch((profileError) => {
				if (ignore) return;
				setProfileState({
					username,
					profile: null,
					error: getErrorMessage(profileError, "Failed to load profile."),
				});
			});

		return () => {
			ignore = true;
		};
	}, [username]);

	return (
		<GPageBase>
			<Container maxWidth="lg">
				<Stack spacing={3}>
					<ProfileInfo
						username={username || "Unknown"}
						profile={profile}
						error={error}
						onAvatarUploaded={(nextProfile) => {
							setProfileState({
								username: nextProfile.username,
								profile: nextProfile,
								error: null,
							});
						}}
					/>

					<CBasePaper>
						<CTabs tabs={["STATISTICS", "MATCH_HISTORY", "PROFILE_SETTINGS"]}>
							<ProfileStatisticsPanel scope="me" />
							<ProfileMatchHistoryPanel scope="me" />
							<ProfileModifyMePanel username={user?.username} />
						</CTabs>
					</CBasePaper>
				</Stack>
			</Container>
		</GPageBase>
	);
};

export default PProfileMe;
