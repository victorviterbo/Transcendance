import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CAuthProvider } from "./components/auth/CAuthProvider.tsx";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import mockStart from "./mock/mock.ts";
import { startLocalization } from "./localization/localization.ts";

const startApp = () => {
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<CAuthProvider>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</CAuthProvider>
		</StrictMode>,
	);
};

const startLoc = () => {
	startLocalization()
	.catch((error) => {
		console.error("Localization failed to start:", error);
	})
	.finally(() => {
		startApp();
	});
}

void mockStart()
	.catch((error) => {
		console.error("MSW failed to start:", error);
	})
	.finally(() => {
		startLoc();
	});

