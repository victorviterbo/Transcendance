import type { GCompProps } from "../common/GProps";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";
import {
	CGamePaperStyle,
	CGamePaperTitleBoxStyle,
	CGamePaperTitleStyle,
} from "../../styles/components/surfaces/CGamePaper";
import { Box, Stack } from "@mui/material";
import CTitle from "../text/CTitle";

export interface CGameBasePaperProps extends GCompProps, CBasePaperProps {
	title: string;
}

function CGamePaper({ title, sx, ...other }: CGameBasePaperProps) {
	return (
		<CBasePaper sx={[CGamePaperStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...other}>
			<Stack>
				<Box sx={CGamePaperTitleBoxStyle}>
					<CTitle sx={CGamePaperTitleStyle} align={"center"} size="2xs" weight={100}>
						{title}
					</CTitle>
				</Box>
			</Stack>
		</CBasePaper>
	);
}

export default CGamePaper;
