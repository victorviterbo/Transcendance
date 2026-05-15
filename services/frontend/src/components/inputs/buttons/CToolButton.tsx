import { IconButton, type IconButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps";
import { CToolButtonStyle } from "../../../styles/components/inputs/CToolButtonStyle";

export interface CToolButtonProps extends GProps, IconButtonProps {}

function CToolButton({ sx, children, ...other }: CToolButtonProps) {
	return (
		<IconButton
			color="inherit"
			sx={[CToolButtonStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		>
			{children}
		</IconButton>
	);
}

export default CToolButton;
