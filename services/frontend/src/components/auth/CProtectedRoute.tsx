import { Navigate } from "react-router-dom";
import { useAuth } from "./CAuthProvider";
import type { ReactNode } from "react";

interface CProtectedRouteProps {
	children: ReactNode;
}

function CProtectedRoute({ children }: CProtectedRouteProps) {
	const { status } = useAuth();

	// TODO make a nice loading page, with the vinyl?
	if (status === "loading") {
		return <div>Loading...</div>;
	}

	return status === "authed" ? children : <Navigate to="/auth" replace />;
}

export default CProtectedRoute;
