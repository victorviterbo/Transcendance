import { Box, Container, Grid, useMediaQuery, useTheme } from "@mui/material";
import { appPositions } from "../../styles/theme";
import PCreateRoom from "./PCreateRoom";
import PJoinRoom from "./PJoinRoom";
import PRoomList from "./PRoomList";
import { useAuth } from "../../components/auth/CAuthProvider";

const PHomePage = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

	const spacing: number = isSmall ? appPositions.smallSpacing : appPositions.mainSpacing;
	const { status } = useAuth();

	return (
		<Container sx={{ p: spacing }}>
			<Grid container spacing={spacing} columns={{ xs: 12, md: 5 }}>
				<Grid size={{ xs: 12, md: 3 }}>
					<PCreateRoom></PCreateRoom>
				</Grid>
				<Grid size={{ xs: 12, md: 2 }}>
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
	);
};

export default PHomePage;
