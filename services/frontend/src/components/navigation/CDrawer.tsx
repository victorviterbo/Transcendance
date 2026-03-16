import { Drawer, type DrawerProps } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import { CDrawerStyle } from "../../styles/components/navigation/CDrawerStyle";

export interface CDrawerProps extends GCompProps, DrawerProps {
	width?: string | number;
	top?: string | number;
}

function CDrawer(props: CDrawerProps) {
	const { sx, ...other } = props;

	return (
		<Drawer
			sx={[CDrawerStyle(props), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			variant="persistent"
			anchor="right"
			{...other}
		></Drawer>
	);
}

export default CDrawer;
