import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";
import { type CTitleProps } from "../text/CTitle";
import { CNavbarLinkStyle } from "../../styles/components/navigation/CNavbarStyle";
import CText from "../text/CText";
import { ttr } from "../../localization/localization";

export interface CNavbarLinkProps extends CTitleProps {
	to: string;
	label: string;
	icon?: ReactNode;
	active?: boolean;
}

//TODO change style
function CNavbarLink({ to, sx, label, icon, active = false }: CNavbarLinkProps) {
	return (
		<Link to={to} style={{ textDecoration: "none", color: "inherit" }} aria-label={ttr(label)}>
			<CText
				size="lg"
				noTr={true}
				sx={[CNavbarLinkStyle(active), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			>
				{icon}
				<Box component="span" className="CNavbarLink-label">
					{ttr(label)}
				</Box>
			</CText>
		</Link>
	);
}

export default CNavbarLink;
