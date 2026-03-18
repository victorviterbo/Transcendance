import { Avatar, Box, Container, Stack } from "@mui/material";
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
		<CBasePaper
			sx={{
				p: { xs: 2.5, md: 3.5 },
				background:
					"radial-gradient(circle at 16% 18%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 20%), linear-gradient(145deg, rgba(66, 237, 255, 0.18) 0%, rgba(83, 107, 255, 0.22) 44%, rgba(255, 88, 188, 0.26) 100%), linear-gradient(145deg, #3341AB 0%, #4D36BF 46%, #7D2EBF 100%)",
			}}
		>
			<Stack
				direction={{ xs: "column", md: "row" }}
				spacing={3}
				alignItems={{ xs: "center", md: "center" }}
				justifyContent="space-between"
			>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={2.5}
					alignItems={{ xs: "center", sm: "center" }}
				>
					<Avatar
						sx={{
							width: 112,
							height: 112,
							bgcolor: "secondary.main",
							fontWeight: "bold",
							fontSize: "2.8rem",
							border: "4px solid rgba(255, 255, 255, 0.86)",
							boxShadow: "0 10px 0 rgba(23, 15, 56, 0.22)",
						}}
					>
						{username.charAt(0).toUpperCase()}
					</Avatar>
					<Stack spacing={0.8} alignItems={{ xs: "center", sm: "flex-start" }}>
						<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
							PLAYER CARD
						</CText>
						<CTitle
							size="md"
							sx={{ fontSize: { xs: "2.1rem", md: "2.8rem" }, color: "common.white" }}
						>
							{username}
						</CTitle>
						<CText size="lg" sx={{ color: "rgba(255, 255, 255, 0.88)" }}>
							Your profile should feel like a reward screen, not a raw form sheet.
						</CText>
					</Stack>
				</Stack>
				<Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
					<Box
						sx={{
							px: 2.25,
							py: 1.2,
							borderRadius: "22px",
							backgroundColor: "rgba(255, 255, 255, 0.14)",
							border: "2px solid rgba(255, 255, 255, 0.22)",
							minWidth: 120,
						}}
					>
						<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.74)" }}>
							TITLE
						</CText>
						<CTitle size="sm" sx={{ color: "common.white" }}>
							{title}
						</CTitle>
					</Box>
					<Box
						sx={{
							px: 2.25,
							py: 1.2,
							borderRadius: "22px",
							backgroundColor: "rgba(255, 255, 255, 0.14)",
							border: "2px solid rgba(255, 255, 255, 0.22)",
							minWidth: 120,
						}}
					>
						<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.74)" }}>
							XP
						</CText>
						<CTitle size="sm" sx={{ color: "common.white" }}>
							{xp}
						</CTitle>
					</Box>
				</Stack>
			</Stack>
		</CBasePaper>
	);
};

const PProfileMe = () => {
	const { user } = useAuth();

	return (
		<GPageBase>
			<Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
				<Stack spacing={3}>
					<ProfileInfo />

					<CBasePaper sx={{ p: { xs: 2, md: 3 } }}>
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
