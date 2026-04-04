import { ToggleButton, type ToggleButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps";
import { CToggleButtonStyle } from "../../../styles/components/inputs/CToggleStyle";

export interface CButtonToggleProps extends GProps, ToggleButtonProps {}

function CButtonToggle({ sx, ...other }: CButtonToggleProps) {
	return (
		<ToggleButton
			sx={[CToggleButtonStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		></ToggleButton>
	);
}

export default CButtonToggle;
