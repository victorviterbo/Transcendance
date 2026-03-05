import { Button, type ButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps.ts";
import { ttr } from "../../../localization/localization.ts";
import CButtonStyle from "../../../styles/components/inputs/CButtonStyle.ts";

export interface CButtonProps extends GProps, ButtonProps {}

function CButton({ children, sx, ...other }: CButtonProps) {
	return (
		<Button
			variant="contained"
			sx={[...(Array.isArray(sx) ? sx : sx ? [sx] : []), CButtonStyle]}
			{...other}
		>
			{typeof children == "string" ? ttr(children) : children}
		</Button>
	);
}

export default CButton;
