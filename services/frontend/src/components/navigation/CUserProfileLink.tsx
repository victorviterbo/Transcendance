import { ButtonBase, type ButtonBaseProps } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface CUserProfileLinkProps extends Omit<ButtonBaseProps, "onClick"> {
	username: string;
	children: ReactNode;
}

function CUserProfileLink({ username, children, sx, ...other }: CUserProfileLinkProps) {
	const navigate = useNavigate();

	return (
		<ButtonBase
			onClick={() => navigate(`/users/${encodeURIComponent(username)}`)}
			sx={[
				{ display: "block", justifyContent: "flex-start", textAlign: "left" },
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			{children}
		</ButtonBase>
	);
}

export default CUserProfileLink;
