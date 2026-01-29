import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import mockStart from "./mock/mock.ts";

const startApp = () => {
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
};

void mockStart()
	.catch((error) => {
		console.error("MSW failed to start:", error);
	})
	.finally(() => {
		startApp();
	});
