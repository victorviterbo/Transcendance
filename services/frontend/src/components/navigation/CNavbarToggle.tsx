import type { ReactNode } from "react";
import { appPositions } from "../../styles/theme";
import CButtonToggle, { type CButtonToggleProps } from "../inputs/buttons/CButtonToggle";

export interface CNavbarToggleProps extends Omit<
	CButtonToggleProps,
	"children" | "aria-label" | "value"
> {
	icon: ReactNode;
	aria: string;
	active: boolean;
}

function CNavbarToggle({ icon, aria, active, sx, ...other }: CNavbarToggleProps) {
	return (
		<CButtonToggle
			value={aria}
			selected={active}
			aria-label={aria}
			sx={[
				{ height: appPositions.sizes.buttons.nav },
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			data-testid={aria + "_CIconButton"}
			{...other}
		>
			{icon}
		</CButtonToggle>
	);
}

export default CNavbarToggle;
