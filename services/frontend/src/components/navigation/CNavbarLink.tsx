import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { type CTitleProps } from "../text/CTitle";
import { CNavbarLinkStyle } from "../../styles/components/navigation/CNavbarStyle";
import CText from "../text/CText";

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
			<CText
				size="md"
				span={true}
				sx={[CNavbarLinkStyle(active), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			>
				{icon}
				{label}
			</CText>
		</Link>
	);
}

export default CNavbarLink;
