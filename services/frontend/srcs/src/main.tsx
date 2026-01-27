import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import mockStart from "./mock/mock.ts";
import App from "./App.tsx";

mockStart().then(() => {
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
});
