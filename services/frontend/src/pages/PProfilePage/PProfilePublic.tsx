import { Avatar, Container, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTabs from "../../components/navigation/CTabs";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import ProfileMatchHistoryPanel from "./PProfileMatchHistoryPanel";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";
import { getErrorMessage } from "../../utils/error";
import { fetchProfile, resolveProfileImage } from "../../api/profile";
import { type IProfileData } from "../../types/profile";

interface ProfileState {
	username: string;
	profile: IProfileData | null;
	error: string | null;
}

interface PProfilePublicProps {
	username: string;
}

function PProfilePublic({ username }: PProfilePublicProps) {
	const [profileState, setProfileState] = useState<ProfileState>({
		username: "",
		profile: null,
		error: null,
	});
	const profile = profileState.username === username ? profileState.profile : null;
	const error = profileState.username === username ? profileState.error : null;

	useEffect(() => {
		let ignore = false;
		if (!username) return;

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

	const displayUsername = profile?.username ?? username;
	const displayBadge = profile?.badges ?? "Unknown";
	const displayXp = profile?.exp_points ?? 0;

	return (
		<GPageBase>
			<Container maxWidth="lg">
				<Stack spacing={3} sx={{ mt: 3 }}>
					<CBasePaper sx={{ p: 3 }}>
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={2}
							alignItems={{ xs: "flex-start", sm: "center" }}
						>
							<Avatar
								src={resolveProfileImage(profile?.image)}
								sx={{
									width: 88,
									height: 88,
									bgcolor: "secondary.main",
									fontWeight: "bold",
									fontSize: "2rem",
								}}
							>
								{displayUsername.charAt(0).toUpperCase()}
							</Avatar>
							<Stack>
								<CTitle size="md">{displayUsername}</CTitle>
								<CText size="sm">Badge: {displayBadge}</CText>
								<CText size="sm">XP: {displayXp}</CText>
								{error && (
									<CText size="sm" color="error">
										{error}
									</CText>
								)}
							</Stack>
						</Stack>
					</CBasePaper>

					<CBasePaper>
						<CTabs tabs={["Statistics", "Match history"]}>
							<ProfileStatisticsPanel scope="public" />
							<ProfileMatchHistoryPanel scope="public" />
						</CTabs>
					</CBasePaper>
				</Stack>
			</Container>
		</GPageBase>
	);
}

export default PProfilePublic;
