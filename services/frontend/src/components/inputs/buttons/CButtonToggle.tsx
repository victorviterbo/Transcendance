import { Box, ToggleButton, type SxProps, type Theme, type ToggleButtonProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import {
	CToggleButtonNotif,
	CToggleButtonStyle,
} from "../../../styles/components/inputs/CToggleStyle";
import CText from "../../text/CText";
import type { ReactNode } from "react";
import { ttr } from "../../../localization/localization";
import { sxMerger } from "../../../utils/styles";

export interface CButtonToggleProps extends GCompProps, ToggleButtonProps {
	notifCount?: number;
	boxSx?: SxProps<Theme>;

	//DEBUG
	parentid?: string;
}

function CButtonToggle({
	notifCount,
	sx,
	boxSx,
	parentid,
	children,
	...other
}: CButtonToggleProps) {
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
		<Box
			data-testid={parentid}
			sx={boxSx ? sxMerger(boxSx, { position: "relative" }) : { position: "relative" }}
		>
			{getNotif()}
			<ToggleButton
				sx={[CToggleButtonStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
				{...other}
			>
				{typeof children == "string" ? <span>{ttr(children)}</span> : children}
			</ToggleButton>
		</Box>
	);
}

export default CButtonToggle;
