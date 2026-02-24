// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../components/auth/CAuthProvider";
import { Box, Grid, Stack } from "@mui/material";
import GPageBase from "../common/GPageBases";
import { appThemeDef } from "../../styles/theme";
import PCreateRoom from "./PCreateRoom";
import PJoinRoom from "./PJoinRoom";
import PFriendsRooms from "./PFriendsRooms";
import PPublicRooms from "./PPublicRooms";

const PHomePage = () => {
	//const navigate = useNavigate();
	//const { status, user, logout } = useAuth();

	const spacing: number = appThemeDef.positions.mainSpacing;

	return (
		<GPageBase>
			<Stack
				sx={{
					width: "100%",
					pt: spacing,
					pb: spacing,
					pr: spacing,
					pl: spacing,
				}}
			>
				<Grid container spacing={spacing} sx={{ width: "100%" }}>
					<Grid size={{ xs: 12, sm: 12, md: 6, lg: 3 }}>
						<PCreateRoom></PCreateRoom>
					</Grid>
					<Grid size={{ xs: 12, sm: 12, md: 6, lg: 3 }}>
						<PJoinRoom></PJoinRoom>
					</Grid>
					<Grid size={{ xs: 12, sm: 12, md: 6, lg: 3 }}>
					</Grid>
					<Grid size={{ xs: 12, sm: 12, md: 6, lg: 3 }}>
					</Grid>
					<Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
						<PFriendsRooms></PFriendsRooms>
					</Grid>
				</Grid>
				<Box sx={{ flex: 1, mt: spacing }}>
					<PPublicRooms></PPublicRooms>
				</Box>
			</Stack>
		</GPageBase>
	);
};

export default PHomePage;

// <Container maxWidth="sm" sx={{ mt: 8 }}>
// 	<Box display="flex" flexDirection="column" gap={2} alignItems="center">
// 		<CTitle align="center" size="lg">
// 			Welcome
// 		</CTitle>
// 		{status === "authed" && (
// 			<CTitle align="center" size="sm">
// 				Hello {user?.username ?? "there"}!
// 			</CTitle>
// 		)}
// 		{status === "authed" ? (
// 			<>
// 				<CButton onClick={() => navigate("/profile")}>My Profile</CButton>
// 				<CButton
// 					onClick={async () => {
// 						logout();
// 						navigate("/");
// 					}}
// 				>
// 					Log out
// 				</CButton>
// 			</>
// 		) : (
// 			<CButton onClick={() => navigate("/auth")}>Go to Auth</CButton>
// 		)}
// 	</Box>
// </Container>
