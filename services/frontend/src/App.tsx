import { Routes, Route } from "react-router-dom";
import PHomePage from "./pages/PHomePage";
import PLeaderboardPage from "./pages/PLeaderboardPage";
import PAuthPage from "./pages/PAuthPage";
import PProfilePage from "./pages/PProfilePage";
import CProtectedRoute from "./components/auth/CProtectedRoute";
import { CssBaseline, ThemeProvider } from "@mui/material";
import appTheme from "./styles/theme";
import CNavbar from "./components/navigation/CNavbar";

function App() {
	return (
		<ThemeProvider theme={appTheme}>
			<CssBaseline />
			<CNavbar />
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
				<Route
					path="/leaderboard"
					element={
						<CProtectedRoute>
							<PLeaderboardPage />
						</CProtectedRoute>
					}
				/>
			</Routes>
		</ThemeProvider>
	);
}

export default App;
