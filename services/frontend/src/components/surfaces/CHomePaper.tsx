import { Box, Stack } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";
import CText from "../text/CText";
import {
	CHomePaperContentBox,
	CHomePaperStyle,
	CHomePaperTitleBoxStyle,
	CHomePaperTitleStyle,
} from "../../styles/components/surfaces/CHomePaper";

interface CHomePaperProps extends GCompProps, CBasePaperProps {
	title: string;
}

function CHomePaper({ title, children, sx, ...other }: CHomePaperProps) {
	return (
		<CBasePaper sx={[CHomePaperStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...other}>
			<Stack sx={{ alignItems: "stretch" }}>
				<Box sx={CHomePaperTitleBoxStyle}>
					<CText sx={CHomePaperTitleStyle} size="lg" textAlign="center">
						{title}
					</CText>
				</Box>
				<Box sx={CHomePaperContentBox}>{children}</Box>
			</Stack>
		</CBasePaper>
	);
}

export default CHomePaper;
