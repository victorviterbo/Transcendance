import { Box, Stack } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";
import CText from "../text/CText";
import {
	CTitlePaperBodyStyle,
	CTitlePaperContainerStyle,
	CTitlePaperContentBox,
	CTitlePaperTitleBoxStyle,
	CTitlePaperTitleStyle,
} from "../../styles/components/surfaces/CTitlePaper";

import type { TSize } from "../../types/string";
import CTitle from "../text/CTitle";

interface CTitlePaperProps extends GCompProps, CBasePaperProps {
	title: string;
	titleType?: "text" | "title";
	titleSize?: TSize;
}

function CTitlePaper({ title, titleType, titleSize, children, sx, ...other }: CTitlePaperProps) {
	return (
		<Stack sx={[CTitlePaperContainerStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
			<Box sx={CTitlePaperTitleBoxStyle}>
				{titleType == undefined || titleType == "text" ? (
					<CText
						sx={CTitlePaperTitleStyle}
						size={titleSize == undefined ? "lg" : titleSize}
						textAlign="center"
					>
						{title}
					</CText>
				) : (
					<CTitle
						sx={CTitlePaperTitleStyle}
						size={titleSize == undefined ? "lg" : titleSize}
						textAlign="center"
					>
						{title}
					</CTitle>
				)}
			</Box>
			<CBasePaper sx={CTitlePaperBodyStyle} {...other}>
				<Box sx={CTitlePaperContentBox}>{children}</Box>
			</CBasePaper>
		</Stack>
	);
}

export default CTitlePaper;
