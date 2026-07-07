import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";
import { type CTitleProps } from "../text/CTitle";
import { CNavbarLinkStyle } from "../../styles/components/navigation/CNavbarStyle";
import CText from "../text/CText";
import { useLang } from "../contexts/CLanguageProvider";

export interface CNavbarLinkProps extends CTitleProps {
	to: string;
	label: string;
	icon?: ReactNode;
	active?: boolean;
}

//TODO change style
function CNavbarLink({ to, sx, label, icon, active = false }: CNavbarLinkProps) {
	const { ttr } = useLang();

	return (
		<Box
			component={Link}
			to={to}
			aria-label={ttr(label)}
			sx={{
				textDecoration: "none",
				color: "inherit",
			}}
		>
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
		</Box>
	);
}

export default CNavbarLink;
