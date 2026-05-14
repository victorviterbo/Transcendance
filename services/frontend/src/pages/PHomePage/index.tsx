import { Box, Container, Grid } from "@mui/material";
import GPageBase from "../common/GPageBases";
import { appPositions } from "../../styles/theme";
import PCreateRoom from "./PCreateRoom";
import PJoinRoom from "./PJoinRoom";
import PRooms from "./PRooms";

const PHomePage = () => {
	const spacing: number = appPositions.mainSpacing;

	return (
		<GPageBase>
			<Container sx={{ p: spacing }}>
				<Grid container spacing={spacing}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<PCreateRoom></PCreateRoom>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<PJoinRoom></PJoinRoom>
					</Grid>
				</Grid>
				<Box sx={{ mt: spacing }}>
					<PRooms isPublic={false}></PRooms>
				</Box>
				<Box sx={{ mt: spacing }}>
					<PRooms isPublic={true}></PRooms>
				</Box>
			</Container>
		</GPageBase>
	);
};

export default PHomePage;
