import { Paper } from "@mui/material";
import type { ReactNode } from "react";
import type { GCompProps } from "../../components/common/GProps.tsx";

interface CBasePaperProps extends GCompProps {
	children?: ReactNode;
}

//TODO: Change sx here
function CBasePaper({ children }: CBasePaperProps) {
	//====================== DOM ======================
	return (
		<Paper elevation={3} sx={{ mt: 8, p: 4 }}>
			{children}
		</Paper>
	);
}

export default CBasePaper;
