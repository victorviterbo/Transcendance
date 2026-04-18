import { Box, ToggleButton, type ToggleButtonProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import {
	CToggleButtonNotif,
	CToggleButtonStyle,
} from "../../../styles/components/inputs/CToggleStyle";
import CText from "../../text/CText";
import type { ReactNode } from "react";

export interface CButtonToggleProps extends GCompProps, ToggleButtonProps {
	notifCount?: number;

	//DEBUG
	parentid?: string;
}

function CButtonToggle({ notifCount, sx, parentid, ...other }: CButtonToggleProps) {
	function getNotif(): ReactNode | undefined {
		if (!notifCount) return;
		if (notifCount <= 0) return;
		return (
			<Box sx={CToggleButtonNotif} data-testid="CButtonToggleNotif">
				<CText size="xs">{notifCount}</CText>
			</Box>
		);
	}

	return (
		<Box data-testid={parentid} sx={{ position: "relative" }}>
			{getNotif()}
			<ToggleButton
				sx={[CToggleButtonStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
				{...other}
			></ToggleButton>
		</Box>
	);
}

export default CButtonToggle;
