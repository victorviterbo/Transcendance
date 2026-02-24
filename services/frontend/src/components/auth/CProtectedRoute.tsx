import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./CAuthProvider";

function CProtectedRoute() {
	const { status } = useAuth();
	//TODO Loading page?
	if (status === "loading") return <div>Loading...</div>;
	return status === "authed" ? <Outlet /> : <Navigate to="/auth" replace />;
}

export default CProtectedRoute;
