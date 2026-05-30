import { Box, Container, Grid } from "@mui/material";
import GPageBase from "../common/GPageBases";
import { appPositions } from "../../styles/theme";
import PCreateRoom from "./PCreateRoom";
import PJoinRoom from "./PJoinRoom";
import PRoomList from "./PRoomList";
import { useAuth } from "../../components/auth/CAuthProvider";

const PHomePage = () => {
	const spacing: number = appPositions.mainSpacing;
	const { status } = useAuth();

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
				{status === "authed" ? (
					<Box sx={{ mt: spacing }}>
						<PRoomList isPublic={false}></PRoomList>
					</Box>
				) : null}
				<Box sx={{ mt: spacing }}>
					<PRoomList isPublic={true}></PRoomList>
				</Box>
			</Container>
		</GPageBase>
	);
};

export default PHomePage;
