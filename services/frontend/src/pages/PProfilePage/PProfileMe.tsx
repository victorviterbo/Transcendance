import { Avatar, Container, Stack } from "@mui/material";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import CTabs from "../../components/navigation/CTabs";
import { useAuth } from "../../components/auth/CAuthProvider";
import ProfileMatchHistoryPanel from "./PProfileMatchHistoryPanel";
import ProfileModifyMePanel from "./PProfileSettingsPanel";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";

const ProfileInfo = () => {
	const { user } = useAuth();
	const username = user?.username ?? "Unknown";
	const xp = 1280;
	const title = "Rookie";

	return (
		<CBasePaper sx={{ p: 2 }}>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={2}
				alignItems={{ xs: "flex-start", sm: "center" }}
			>
				<Avatar
					sx={{
						width: 88,
						height: 88,
						bgcolor: "secondary.main",
						fontWeight: "bold",
						fontSize: "2rem",
					}}
				>
					{username.charAt(0).toUpperCase()}
				</Avatar>
				<Stack>
					<CTitle size="md">{username}</CTitle>
					<CText size="sm">Title: {title}</CText>
					<CText size="sm">XP: {xp}</CText>
				</Stack>
			</Stack>
		</CBasePaper>
	);
};

const PProfileMe = () => {
	const { user } = useAuth();

	return (
		<GPageBase>
			<Container maxWidth="lg">
				<Stack spacing={3}>
					<ProfileInfo />

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
