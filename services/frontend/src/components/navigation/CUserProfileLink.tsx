import { ButtonBase, type ButtonBaseProps } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import CText from "../text/CText";

interface CUserProfileLinkProps extends Omit<ButtonBaseProps, "onClick"> {
	username: string;
	guest?: boolean;
	children: ReactNode;
}

function CUserProfileLink({ guest, username, children, sx, ...other }: CUserProfileLinkProps) {
	const navigate = useNavigate();

	if (guest)
		return (
			<CText
				noTr={true}
				sx={[
					{ display: "block", justifyContent: "flex-start", textAlign: "left" },
					...(Array.isArray(sx) ? sx : sx ? [sx] : []),
				]}
				{...other}
			>
				{children}
			</CText>
		);
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
