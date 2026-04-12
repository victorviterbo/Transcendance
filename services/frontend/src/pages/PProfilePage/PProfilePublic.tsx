import { Avatar, Container, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTabs from "../../components/navigation/CTabs";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import ProfileMatchHistoryPanel from "./PProfileMatchHistoryPanel";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";
import { getErrorMessage } from "../../utils/error";
import CLevelProgress from "../../components/feedback/CLevelProgress";
import CProfileRequestState from "../../components/feedback/CProfileRequestState";
import { fetchProfile, getProfileLevelProgress, resolveProfileImage } from "../../api/profile";
import { type IProfileData } from "../../types/profile";
import PUserNotFound from "../static/PUserNotFound";

type ProfileStatus = "idle" | "loading" | "ready" | "notFound" | "error";

interface ProfileState {
	username: string;
	status: ProfileStatus;
	profile: IProfileData | null;
	error: string | null;
}

interface PProfilePublicProps {
	username: string;
}

const isProfileNotFoundError = (error: unknown): boolean => {
	if (typeof error !== "object" || error === null) return false;

	const maybe = error as {
		response?: {
			status?: number;
			data?: { error?: string | Record<string, string> };
		};
	};
	const status = maybe.response?.status;
	const payload = maybe.response?.data?.error;

	if (status === 404) return true;
	return status === 400 && payload === "No profile with this username";
};

function PProfilePublic({ username }: PProfilePublicProps) {
	const [profileState, setProfileState] = useState<ProfileState>({
		username: "",
		status: "idle",
		profile: null,
		error: null,
	});
	const isCurrentUsername = profileState.username === username;
	const profile = isCurrentUsername ? profileState.profile : null;
	const error = isCurrentUsername ? profileState.error : null;
	const status = !username ? "idle" : isCurrentUsername ? profileState.status : "loading";

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
				if (isProfileNotFoundError(profileError)) {
					setProfileState({
						username,
						status: "notFound",
						profile: null,
						error: null,
					});
					return;
				}
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

	if (status === "notFound") return <PUserNotFound />;

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

	const displayUsername = profile.username;
	const displayBadge = profile.badges;
	const displayXp = profile.exp_points ?? 0;
	const levelProgress = getProfileLevelProgress(displayXp);

	return (
		<GPageBase>
			<Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
				<Stack spacing={3} sx={{ mt: 3 }}>
					<CBasePaper sx={{ p: 3 }}>
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={2}
							alignItems={{ xs: "flex-start", sm: "center" }}
						>
							<Avatar
								src={resolveProfileImage(profile.avatar)}
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
							<Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
								<CTitle size="md">{displayUsername}</CTitle>
								<CLevelProgress
									level={levelProgress.level}
									progressPercent={levelProgress.progressPercent}
									title={displayBadge}
								/>
							</Stack>
						</Stack>
					</CBasePaper>

					<CBasePaper>
						<CTabs tabs={["STATISTICS", "MATCH_HISTORY"]}>
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
