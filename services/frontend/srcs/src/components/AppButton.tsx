import { Button } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
    onClick: () => void;
}

function AppButton({ children, onClick }: Props) {
    return (
        <Button onClick={onClick} variant="contained">
            {children}
        </Button>
    );
}

export default AppButton;
