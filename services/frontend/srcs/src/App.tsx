import { useState } from "react";
import AppTitle from "./components/AppTitle";
import AppButton from "./components/AppButton";
import AuthPage from "./pages/AuthPage";

function App() {
    const [count, setCount] = useState<number>(0);

    return (
        <>
            <AppTitle count={count}></AppTitle>
            <AppButton
                onClick={() => {
                    setCount(count + 1);
                }}
            >
                Add
            </AppButton>
            <AuthPage />
        </>
    );
}

export default App;
