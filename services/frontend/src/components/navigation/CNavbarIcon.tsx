import type { ReactNode } from "react";
import { type IconButtonProps } from "@mui/material";
import CIconButton from "../inputs/buttons/CIconButton";
import { appPositions } from "../../styles/theme";

export interface CNavbarIconProps extends Omit<IconButtonProps, "children" | "aria-label"> {
	icon: ReactNode;
	aria: string;
}

function CNavbarIcon({ icon, aria, sx, ...other }: CNavbarIconProps) {
	return (
		<CIconButton
			aria-label={aria}
			sx={[
				{ height: appPositions.sizes.buttons.nav },
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			{icon}
		</CIconButton>
	);
}

export default CNavbarIcon;
