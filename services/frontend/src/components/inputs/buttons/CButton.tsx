import { Button, type ButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps.ts";
import { ttr } from "../../../localization/localization.ts";

export interface CButtonProps extends GProps, ButtonProps {}

function CButton({ children, ...other }: CButtonProps) {
	return (
		<Button variant="contained" {...other}>
			{typeof children == "string" ? ttr(children) : children}
		</Button>
	);
}

export default CButton;
