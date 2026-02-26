import { Button, type ButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps.ts";
import { ttr } from "../../../localization/localization.ts";

export interface CButtonProps extends GProps, ButtonProps {}

function CButton({ children, ...other }: CButtonProps) {
	return (
		<Button sx={{
			boxShadow: "0 5px 0px 5px black"
		}} variant="contained" {...other}>
			{typeof children == "string" ? ttr(children) : children}
		</Button>
	);
}

export default CButton;
