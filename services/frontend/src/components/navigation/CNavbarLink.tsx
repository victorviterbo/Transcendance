import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CTitle from "../text/CTitle";
import { type CTitleProps } from "../text/CTitle";
import { CNavbarLinkStyle } from "../../styles/components/navigation/CNavbarStyle";

export interface CNavbarLinkProps extends CTitleProps {
	to: string;
	label: string;
	icon?: ReactNode;
	active?: boolean;
}

//TODO change style
function CNavbarLink({ to, sx, label, icon, active = false }: CNavbarLinkProps) {
	return (
		<Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
			<CTitle
				size="sm"
				sx={[CNavbarLinkStyle(active), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			>
				{icon}
				{label}
			</CTitle>
		</Link>
	);
}

export default CNavbarLink;
