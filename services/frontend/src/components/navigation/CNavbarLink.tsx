import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CTitle from "../text/CTitle";
import { type CTitleProps } from "../text/CTitle";

export interface CNavbarLinkProps extends CTitleProps {
	to: string;
	label: string;
	icon?: ReactNode;
	active?: boolean;
}

//TODO change style
function CNavbarLink({ to, label, icon, active = false }: CNavbarLinkProps) {
	return (
		<Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
			<CTitle
				size="sm"
				sx={{
					textDecoration: "none",
					color: "inherit",
					display: "inline-flex",
					alignItems: "center",
					gap: 1,
					px: 1.5,
					py: 0.5,
					borderRadius: 1,
					border: "2px",
					backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
					"&:hover": {
						backgroundColor: active
							? "rgba(255,255,255,0.2)"
							: "rgba(255,255,255,0.12)",
					},
				}}
			>
				{icon}
				{label}
			</CTitle>
		</Link>
	);
}

export default CNavbarLink;
