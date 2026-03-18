import { Box, Grid, Stack } from "@mui/material";
import GPageBase from "../common/GPageBases";
import { appPositions } from "../../styles/theme";
import PCreateRoom from "./PCreateRoom";
import PJoinRoom from "./PJoinRoom";
import PRooms from "./PRooms";
import CTitle from "../../components/text/CTitle";
import CText from "../../components/text/CText";

const PHomePage = () => {
	const spacing: number = appPositions.mainSpacing;

	return (
		<GPageBase>
			<Stack
				sx={{
					width: "100%",
					maxWidth: "1200px",
					mx: "auto",
					pt: { xs: 5, md: 6 },
					pb: { xs: 6, md: 7 },
					px: { xs: 2, sm: 3, md: 4 },
				}}
			>
				<Box sx={{ mb: { xs: 4, md: 5 }, maxWidth: "48rem" }}>
					<CTitle
						size="lg"
						sx={{
							fontSize: { xs: "2.7rem", md: "4.3rem" },
							lineHeight: 0.9,
							color: "common.white",
							mb: 1.5,
						}}
					>
						MIX, MATCH, AND DIVE INTO THE NEXT ROOM
					</CTitle>
					<CText
						size="lg"
						sx={{
							fontSize: { xs: "1rem", md: "1.12rem" },
							lineHeight: 1.5,
							color: "rgba(255, 255, 255, 0.92)",
							maxWidth: "40rem",
						}}
					>
						Create a private lobby for friends, jump into a public playlist, and keep
						the whole page playful, loud, and readable.
					</CText>
				</Box>
				<Grid container spacing={spacing} sx={{ width: "100%" }}>
					<Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
						<PCreateRoom></PCreateRoom>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
						<PJoinRoom></PJoinRoom>
					</Grid>
				</Grid>
				<Box sx={{ flex: 1, mt: spacing }}>
					<PRooms isPublic={false}></PRooms>
				</Box>
				<Box sx={{ flex: 1, mt: spacing }}>
					<PRooms isPublic={true}></PRooms>
				</Box>
			</Stack>
		</GPageBase>
	);
};

export default PHomePage;
