import { Avatar, Box, Container, Stack } from "@mui/material";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTabs from "../../components/navigation/CTabs";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import ProfileMatchHistoryPanel from "./PProfileMatchHistoryPanel";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";

interface PProfilePublicProps {
	username: string;
}

function PProfilePublic({ username }: PProfilePublicProps) {
	const publicRank = "Silver";

	return (
		<GPageBase>
			<Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
				<Stack spacing={3} sx={{ mt: 3 }}>
					<CBasePaper
						sx={{
							p: { xs: 2.5, md: 3.5 },
							background:
								"radial-gradient(circle at 16% 18%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 20%), linear-gradient(145deg, rgba(255, 216, 74, 0.14) 0%, rgba(83, 107, 255, 0.2) 44%, rgba(255, 88, 188, 0.24) 100%), linear-gradient(145deg, #3341AB 0%, #4D36BF 46%, #7D2EBF 100%)",
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
								<Stack
									spacing={0.8}
									alignItems={{ xs: "center", sm: "flex-start" }}
								>
									<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
										PLAYER CARD
									</CText>
									<CTitle
										size="md"
										sx={{
											fontSize: { xs: "2.1rem", md: "2.8rem" },
											color: "common.white",
										}}
									>
										{username}
									</CTitle>
									<CText size="lg" sx={{ color: "rgba(255, 255, 255, 0.88)" }}>
										A public profile should still feel like a proper spotlight
										card.
									</CText>
								</Stack>
							</Stack>
							<Stack
								direction="row"
								spacing={1.5}
								useFlexGap
								sx={{ flexWrap: "wrap" }}
							>
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
										{publicRank}
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
										920
									</CTitle>
								</Box>
							</Stack>
						</Stack>
					</CBasePaper>

					<CBasePaper sx={{ p: { xs: 2, md: 3 } }}>
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
