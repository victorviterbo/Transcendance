import type { ReactNode } from "react";
import { appPositions } from "../../styles/theme";
import CButtonToggle, { type CButtonToggleProps } from "../inputs/buttons/CButtonToggle";

export interface CNavbarToggleProps extends Omit<CButtonToggleProps, "children" | "value"> {
	icon: ReactNode;
	name: string;
	active: boolean;
	notifCount?: number;
}

function CNavbarToggle({ icon, name, active, notifCount, sx, ...other }: CNavbarToggleProps) {
	return (
		<CButtonToggle
			value={name}
			selected={active}
			sx={[
				{ height: appPositions.sizes.buttons.nav },
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			data-testid={name + "_ToggleButton"}
			parentid={name + "_ToggleButtonParent"}
			notifCount={notifCount}
			{...other}
		>
			{icon}
		</CButtonToggle>
	);
}

export default CNavbarToggle;
