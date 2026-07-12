import { Drawer, type Breakpoint, type DrawerProps } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import { CDrawerStyle } from "../../styles/components/navigation/CDrawerStyle";
import type { TMargin } from "../../types/styles";

export interface CDrawerProps extends GCompProps, DrawerProps {
	width?: number | string | Partial<Record<Breakpoint, string>>;
	margin?: TMargin;
	over?: boolean;
}

function CDrawer(props: CDrawerProps) {
	const { sx, over, onClose, ...other } = props;

	const handleClose: NonNullable<DrawerProps["onClose"]> = (event, reason) => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose?.(event, reason);
	};

	return (
		<Drawer
			sx={[CDrawerStyle(props), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			variant={over ? "temporary" : "persistent"}
			anchor="right"
			{...other}
			onClose={handleClose}
			ModalProps={{ keepMounted: true }}
		></Drawer>
	);
}

export default CDrawer;
