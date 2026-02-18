import { Button, type ButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps.ts";

export interface CButtonProps extends GProps, ButtonProps {}

function CButton({ children, ...other }: CButtonProps) {
	return (
		<Button variant="contained" {...other}>
			{children}
		</Button>
	);
}

export default CButton;
