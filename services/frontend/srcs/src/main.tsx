import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

async function startMocks() {
    const { worker } = await import("./mock/browser");
    await worker.start({
        onUnhandledRequest: "bypass", // let unknown requests hit the real network
    });
}

startMocks().then(() => {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
});
