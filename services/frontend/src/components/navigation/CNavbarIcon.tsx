import type { ReactNode } from "react";
import { type IconButtonProps } from "@mui/material";
import CIconButton from "../inputs/buttons/CIconButton";
import { appPositions } from "../../styles/theme";

export interface CNavbarIconProps extends Omit<IconButtonProps, "children"> {
	icon: ReactNode;
	name: string;
}

function CNavbarIcon({ icon, name, sx, ...other }: CNavbarIconProps) {
	return (
		<CIconButton
			sx={[
				{ height: appPositions.sizes.buttons.nav },
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			data-testid={name + "_CIconButton"}
			{...other}
		>
			{icon}
		</CIconButton>
	);
}

export default CNavbarIcon;
