import { Box, ToggleButton, type ToggleButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps";
import {
	CToggleButtonNotif,
	CToggleButtonStyle,
} from "../../../styles/components/inputs/CToggleStyle";
import CText from "../../text/CText";
import type { ReactNode } from "react";

export interface CButtonToggleProps extends GProps, ToggleButtonProps {
	notifCount?: number;
}

function CButtonToggle({ notifCount, sx, ...other }: CButtonToggleProps) {
	function getNotif(): ReactNode | undefined {
		if (!notifCount) return;
		if (notifCount <= 0) return;
		return (
			<Box sx={CToggleButtonNotif}>
				<CText size="xs">{notifCount}</CText>
			</Box>
		);
	}

	return (
		<Box sx={{ position: "relative" }}>
			{getNotif()}
			<ToggleButton
				sx={[CToggleButtonStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
				{...other}
			></ToggleButton>
		</Box>
	);
}

export default CButtonToggle;
