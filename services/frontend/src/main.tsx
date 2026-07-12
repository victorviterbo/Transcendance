import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CAuthProvider } from "./components/auth/CAuthProvider.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import mockStart from "./mock/mock.ts";
import CLanguageProvider from "./components/contexts/CLanguageProvider.tsx";
import CAppNotifContext from "./components/contexts/CAppNotifContext.tsx";
import CWebsocketContext from "./components/websocket/CWebsocket.tsx";
import { debugError } from "./utils/debug";
//import { startWS } from "./system/websocket.ts";

const router = createBrowserRouter([
	{
		path: "*",
		element: <App />,
	},
]);

const startApp = () => {
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<CAuthProvider>
				<CLanguageProvider>
					<CAppNotifContext>
						<CWebsocketContext>
							<RouterProvider router={router} />
						</CWebsocketContext>
					</CAppNotifContext>
				</CLanguageProvider>
			</CAuthProvider>
		</StrictMode>,
	);
};

void mockStart()
	.catch((error) => {
		debugError("MSW failed to start:", error);
	})
	.finally(() => {
		startApp();
	});
