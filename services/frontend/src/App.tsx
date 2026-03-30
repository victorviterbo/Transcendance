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
import PInfoPage from "./pages/PInfoPage";

function App() {
	return (
		<ThemeProvider theme={appTheme}>
			<GlobalStyles styles={getFontRegistry()} />
			<CssBaseline />
			<Routes>
				<Route path="/" element={<PHomePage />} />
				<Route path="/auth" element={<PAuthPage />} />
				<Route
					path="/contact"
					element={
						<PInfoPage
							title="CONTACT"
							paragraphs={["CONTACT_PAGE_BODY_1", "CONTACT_PAGE_BODY_2"]}
						/>
					}
				/>
				<Route
					path="/qa"
					element={
						<PInfoPage title="Q_AND_A" paragraphs={["QA_PAGE_BODY_1", "QA_PAGE_BODY_2"]} />
					}
				/>
				<Route
					path="/terms-of-service"
					element={
						<PInfoPage
							title="TERMS_OF_SERVICE"
							paragraphs={["TERMS_PAGE_BODY_1", "TERMS_PAGE_BODY_2"]}
						/>
					}
				/>
				<Route
					path="/privacy-policy"
					element={
						<PInfoPage
							title="PRIVACY_POLICY"
							paragraphs={["PRIVACY_PAGE_BODY_1", "PRIVACY_PAGE_BODY_2"]}
						/>
					}
				/>
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
