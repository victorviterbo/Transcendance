import { Box, Container, Grid, Stack } from "@mui/material";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";

const PLeaderboardPage = () => {
	const leaders = [
		{ name: "NovaKing", points: 1280, accent: "#FFD84A" },
		{ name: "BeatBloom", points: 1155, accent: "#42EDFF" },
		{ name: "EchoPilot", points: 1090, accent: "#FF58BC" },
	];

	return (
		<GPageBase>
			<Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
				<Stack spacing={3.5}>
					<Box sx={{ maxWidth: "42rem" }}>
						<CTitle
							size="lg"
							sx={{
								fontSize: { xs: "2.6rem", md: "4rem" },
								color: "common.white",
								mb: 1.5,
							}}
						>
							LEADERBOARD
						</CTitle>
						<CText
							size="lg"
							sx={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.5 }}
						>
							The final data layer can plug in later. This gives the page the same
							bright, polished language as the rest of the app instead of leaving it
							blank.
						</CText>
					</Box>
					<Grid container spacing={3}>
						{leaders.map((leader, index) => (
							<Grid size={{ xs: 12, md: 4 }} key={leader.name}>
								<CBasePaper
									sx={{
										minHeight: 220,
										background: `radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 24%), linear-gradient(145deg, ${leader.accent}22 0%, rgba(83, 107, 255, 0.2) 42%, rgba(130, 43, 194, 0.26) 100%), linear-gradient(145deg, #3A45B4 0%, #5138BF 48%, #7D2DBF 100%)`,
									}}
								>
									<Stack spacing={1.5}>
										<CText
											size="sm"
											sx={{ color: "rgba(255, 255, 255, 0.76)" }}
										>
											#{index + 1}
										</CText>
										<CTitle size="md" sx={{ color: "common.white" }}>
											{leader.name}
										</CTitle>
										<CText size="lg">{leader.points} pts</CText>
									</Stack>
								</CBasePaper>
							</Grid>
						))}
						<Grid size={{ xs: 12 }}>
							<CTitlePaper title="SEASON_STATUS">
								<CText size="lg" sx={{ lineHeight: 1.55 }}>
									Leaderboard data can slot into this surface next. The page now
									carries the same playful card system as home, auth, and profile
									instead of stopping at an empty route.
								</CText>
							</CTitlePaper>
						</Grid>
					</Grid>
				</Stack>
			</Container>
		</GPageBase>
	);
};

export default PLeaderboardPage;
