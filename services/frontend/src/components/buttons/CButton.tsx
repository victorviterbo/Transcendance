import { Button } from "@mui/material";
import type { ReactNode } from "react";
import type { GProps } from "../../components/common/GProps.tsx";

interface CButtonProps extends GProps {
	children?: ReactNode;
	onClick?: () => void;
}

function CButton({ children, onClick }: CButtonProps) {
	return (
		<Button onClick={onClick} variant="contained">
			{children}
		</Button>
	);
}

export default CButton;
