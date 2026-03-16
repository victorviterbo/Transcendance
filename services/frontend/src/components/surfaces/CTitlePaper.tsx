import { Box, Stack } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";
import CText from "../text/CText";
import {
	CTitlePaperContentBox,
	CTitlePaperStyle,
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
		<CBasePaper
			sx={[CTitlePaperStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		>
			<Stack sx={{ alignItems: "stretch" }}>
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
				<Box sx={CTitlePaperContentBox}>{children}</Box>
			</Stack>
		</CBasePaper>
	);
}

export default CTitlePaper;
