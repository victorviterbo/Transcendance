import { useAuth } from "../../components/auth/CAuthProvider";
import { Navigate, useParams } from "react-router-dom";
import PProfilePublic from "./PProfilePublic";
import PProfileMe from "./PProfileMe";

const PProfilePage = () => {
	const { user } = useAuth();
	const { username } = useParams();

	if (!username || username === user?.username) return <Navigate to="/users/me" />;
	if (username === "me") return <PProfileMe />;
	return <PProfilePublic username={username} />;
};

export default PProfilePage;
