import { Box, Container, Typography } from "@mui/material";
import CTitle from "../../components/text/CTitle";
import { useAuth } from "../../components/auth/CAuthProvider";

const PProfilePage = () => {
	const { user } = useAuth();

	if (!user) {
		return (
			<Container maxWidth="sm" sx={{ mt: 8 }}>
				<CTitle align="center" size="md">
					Profile
				</CTitle>
				<Typography align="center">You are not logged in.</Typography>
			</Container>
		);
	}

	return (
		<Container maxWidth="sm" sx={{ mt: 8 }}>
			<CTitle align="center" size="md">
				Profile
			</CTitle>
			<Box display="flex" flexDirection="column" gap={1} sx={{ mt: 2 }}>
				<Typography>
					<strong>Username:</strong> {user.username ?? "-"}
				</Typography>
				<Typography>
					<strong>Email:</strong> {user.email ?? "-"}
				</Typography>
			</Box>
		</Container>
	);
};

export default PProfilePage;
