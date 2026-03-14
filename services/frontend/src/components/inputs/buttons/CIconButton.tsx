import { IconButton, type IconButtonProps } from "@mui/material";
import { CIconButtonStyle, CButtonStyle } from "../../../styles/components/inputs/CButtonStyle";
import type { GProps } from "../../common/GProps";

interface CIconButtonProps extends GProps, Omit<IconButtonProps, "aria-label" | "color"> {}

function CIconButton({ sx, children, ...other }: CIconButtonProps) {
	return (
		<IconButton color="inherit"
			sx={[
				CIconButtonStyle,
				CButtonStyle,
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			{children}
		</IconButton>
	);
}

export default CIconButton;
