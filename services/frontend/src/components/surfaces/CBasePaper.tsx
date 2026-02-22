import { Paper, type PaperOwnProps } from "@mui/material";
import type { GCompProps } from "../../components/common/GProps.tsx";
import CBasePaperStyle from "../../styles/components/surfaces/CBasePaper.ts";

export interface CBasePaperProps extends GCompProps, PaperOwnProps {}

//TODO: Change sx here
function CBasePaper({ sx, children }: CBasePaperProps) {
	//====================== DOM ======================
	return (
		<Paper elevation={3} sx={[CBasePaperStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
			{children}
		</Paper>
	);
}

export default CBasePaper;
