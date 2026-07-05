import { Routes, Route, useLocation, matchPath } from "react-router-dom";
import PHomePage from "./pages/PHomePage";
import PLeaderboardPage from "./pages/PLeaderboardPage";
import PAuthPage from "./pages/PAuthPage";
import PProfilePage from "./pages/PProfilePage";
import CProtectedRoute from "./components/auth/CProtectedRoute";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import appTheme from "./styles/theme";
import { getFontRegistry } from "./styles/fonts/fonts";
import { PContact, PPageNotFound, PPrivacyPolicy, PQA, PTermsOfService } from "./pages/static";
import PGameBase from "./pages/PGame/PGameBase";
import GPageBase from "./pages/common/GPageBases";

function App() {

	const { pathname } = useLocation()
	const onGamePage = matchPath("/game/*", pathname) ? true : false;

	return (
		<ThemeProvider theme={appTheme}>
			<GlobalStyles styles={getFontRegistry()} />
			<CssBaseline />
			<GPageBase inGame={onGamePage}>
				<Routes>
					<Route path="/" element={<PHomePage />} />
					<Route path="/auth" element={<PAuthPage />} />
					<Route path="/game/:gameid" element={<PGameBase />} />
					<Route path="/contact" element={<PContact />} />
					<Route path="/qa" element={<PQA />} />
					<Route path="/terms-of-service" element={<PTermsOfService />} />
					<Route path="/privacy-policy" element={<PPrivacyPolicy />} />
					<Route element={<CProtectedRoute />}>
						<Route path="/users" element={<PProfilePage />} />
						<Route path="/users/:username" element={<PProfilePage />} />
						<Route path="/leaderboard" element={<PLeaderboardPage />} />
					</Route>
					<Route path="*" element={<PPageNotFound />} />
				</Routes>
			</GPageBase>
		</ThemeProvider>
	);
}

export default App;
