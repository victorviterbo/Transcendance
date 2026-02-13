import { Routes, Route } from "react-router-dom";
import PHomePage from "./pages/PHomePage";
import PAuthPage from "./pages/PAuthPage";
import PProfilePage from "./pages/PProfilePage";
import CProtectedRoute from "./components/auth/CProtectedRoute";

function App() {

	return (
		<Routes>
			<Route path="/" element={<PHomePage />} />
			<Route path="/auth" element={<PAuthPage />} />
			<Route
				path="/profile"
				element={
					<CProtectedRoute>
						<PProfilePage />
					</CProtectedRoute>
				}
			/>
		</Routes>
	);
}

export default App;
