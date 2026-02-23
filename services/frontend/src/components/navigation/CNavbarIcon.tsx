import type { ReactNode } from "react";
import { IconButton, type IconButtonProps } from "@mui/material";

export interface CNavbarIconProps
	extends Omit<IconButtonProps, "children" | "aria-label"> {
	icon: ReactNode;
	aria: string;
}

function CNavbarIcon({ icon, aria, sx, ...other }: CNavbarIconProps) {
	return (
		<IconButton
			color="inherit"
			aria-label={aria}
			sx={[
				{
					px: 1.75,
					py: 0.75,
					borderRadius: 1,
					border: "2px solid",
				},
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			{icon}
		</IconButton>
	);
}

export default CNavbarIcon;
