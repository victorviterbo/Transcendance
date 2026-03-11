import { Routes, Route } from "react-router-dom";
import PHomePage from "./pages/PHomePage";
import PLeaderboardPage from "./pages/PLeaderboardPage";
import PAuthPage from "./pages/PAuthPage";
import PProfilePage from "./pages/PProfilePage";
import CProtectedRoute from "./components/auth/CProtectedRoute";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import appTheme from "./styles/theme";
import { getFontRegistry } from "./styles/fonts/fonts";
import PChat from "./pages/PChat";

function App() {
	return (
		<ThemeProvider theme={appTheme}>
			<GlobalStyles styles={getFontRegistry()} />
			<CssBaseline />
			<Routes>
				<Route path="/" element={<PHomePage />} />
				<Route path="/auth" element={<PAuthPage />} />
				<Route element={<CProtectedRoute />}>
					<Route path="/users" element={<PProfilePage />} />
					<Route path="/users/:username" element={<PProfilePage />} />
					<Route path="/leaderboard" element={<PLeaderboardPage />} />
					<Route path="/chat_test" element={<PChat />} />
				</Route>
			</Routes> 
		</ThemeProvider>
	);
}

export default App;
