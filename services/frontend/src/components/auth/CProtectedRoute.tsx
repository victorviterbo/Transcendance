import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./CAuthProvider";
import GLoading from "../../pages/common/GLoading";

function CProtectedRoute() {
	const { status } = useAuth();
	if (status === "loading") return <GLoading />;
	return status === "authed" ? <Outlet /> : <Navigate to="/auth" replace />;
}

export default CProtectedRoute;
