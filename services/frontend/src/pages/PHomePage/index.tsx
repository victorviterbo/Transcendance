// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../components/auth/CAuthProvider";
import GPageBase from "../common/GPageBases";

const PHomePage = () => {
	//const navigate = useNavigate();
	//const { status, user, logout } = useAuth();

	return <GPageBase></GPageBase>;
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
