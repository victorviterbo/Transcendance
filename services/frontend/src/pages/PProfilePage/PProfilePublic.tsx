import { Avatar, Box, Container, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";
import { getErrorMessage } from "../../utils/error";
import CLevelProgress from "../../components/feedback/CLevelProgress";
import CProfileRequestState from "../../components/feedback/CProfileRequestState";
import { fetchProfile, getProfileLevelProgress, resolveProfileImage } from "../../api/profile";
import { type IProfileData } from "../../types/profile";
import PProfilePublicRelation from "./PProfilePublicRelation";
import {
	PProfilePublicStyle,
	type IProfilePublicStyle,
} from "../../styles/pages/profile/PProfilePublicStyle";

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
	if (status !== 400) return false;
	if (payload === "No profile with this username" || payload === "USER_NOT_FOUND") return true;
	if (payload && typeof payload === "object") {
		return Object.values(payload).some((value) => value === "USER_NOT_FOUND");
	}
	return false;
};

function PProfilePublic({ username }: PProfilePublicProps) {
	const [profileState, setProfileState] = useState<ProfileState>({
		username: "",
		status: "idle",
		profile: null,
		error: null,
	});
	const style: IProfilePublicStyle = useMemo(() => {
		return PProfilePublicStyle();
	}, []);
	const isCurrentUsername = profileState.username === username;
	const profile = isCurrentUsername ? profileState.profile : null;
	const error = isCurrentUsername ? profileState.error : null;
	const status: ProfileStatus = !username
		? "idle"
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

	if (status !== "ready" || profile === null) {
		return (
			<GPageBase>
				<CProfileRequestState
					status={
						status === "notFound"
							? "notFound"
							: status === "error"
								? "error"
								: "loading"
					}
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
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: {
									xs: "1fr",
									md: "minmax(0, 1fr) minmax(260px, 400px) minmax(0, 1fr)",
								},
								gap: 3,
								alignItems: "center",
							}}
						>
							<Stack
								direction="row"
								spacing={2.5}
								alignItems="center"
								sx={{ minWidth: 0 }}
							>
								<Avatar src={resolveProfileImage(profile.avatar)} sx={style.avatar}>
									{displayUsername.charAt(0).toUpperCase()}
								</Avatar>
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
									justifySelf: { xs: "stretch", md: "center" },
								}}
							>
								<CLevelProgress
									level={levelProgress.level}
									progressPercent={levelProgress.progressPercent}
									title={displayBadge}
								/>
							</Box>
							<Box sx={{ justifySelf: { xs: "stretch", md: "end" } }}>
								<PProfilePublicRelation profile={profile} />
							</Box>
						</Box>
					</CBasePaper>

					<CBasePaper>
						<ProfileStatisticsPanel username={profile.username} />
					</CBasePaper>
				</Stack>
			</Container>
		</GPageBase>
	);
}

export default PProfilePublic;
