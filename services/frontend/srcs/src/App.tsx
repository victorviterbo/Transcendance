import { useState } from "react";
import AppTitle from "./components/AppTitle";
import AppButton from "./components/AppButton";

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
        </>
    );
}

export default App;
