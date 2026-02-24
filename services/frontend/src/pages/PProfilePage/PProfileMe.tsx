import { useAuth } from "../../components/auth/CAuthProvider";

function PProfileMe() {
	const { user } = useAuth();

	return <div>{user?.username ?? "-"}</div>;
}

export default PProfileMe;
