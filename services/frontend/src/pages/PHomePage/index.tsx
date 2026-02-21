// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../components/auth/CAuthProvider";
import { Box, Grid, Stack } from "@mui/material";
import GPageBase from "../common/GPageBases";
import { appThemeDef } from "../../styles/theme";
import PCreateRoom from "./PCreateRoom";
import PJoinRoom from "./PJoinRoom";

const PHomePage = () => {
	//const navigate = useNavigate();
	//const { status, user, logout } = useAuth();

	const spacing: number = appThemeDef.positions.mainSpacing;

	return (
		<GPageBase>
			<Stack
				sx={{
					height: "100%",
					width: "100%",
					pt: spacing,
					pb: spacing,
					pr: spacing,
					pl: spacing,
				}}
			>
				<Grid container spacing={spacing} sx={{ height: "25%", width: "100%" }}>
					<Grid size={3}>
						<PCreateRoom></PCreateRoom>
					</Grid>
					<Grid size={3}>
						<PJoinRoom></PJoinRoom>
					</Grid>
					<Grid size={6} sx={{ backgroundColor: "yellow" }}></Grid>
				</Grid>
				<Box sx={{ flex: 1, mt: spacing, backgroundColor: "green" }}></Box>
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
