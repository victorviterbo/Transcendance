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

import type { TOverflow, TPosition, TSize } from "../../types/string";
import CTitle from "../text/CTitle";

export interface CTitlePaperProps extends GCompProps, CBasePaperProps {
	title: string;
	titleType?: "text" | "title";
	titleSize?: TSize;

	contentFlex?: number;
	isFlex?: boolean;
	overflow?: TOverflow;
	position?: TPosition;
}

function CTitlePaper({
	title,
	titleType,
	titleSize,
	children,

	contentFlex,
	isFlex,
	overflow,
	position,

	sx,
	...other
}: CTitlePaperProps) {
	return (
		<CBasePaper
			sx={[CTitlePaperStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		>
			<Stack sx={{ overflow: "hidden", flex: 1, alignItems: "stretch" }}>
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
				<Box
					sx={[
						position ? { position: position } : {},
						isFlex ? { display: "flex", flexDirection: "column" } : {},
						{ overflow: overflow, flex: contentFlex },
						...(Array.isArray(CTitlePaperContentBox)
							? CTitlePaperContentBox
							: CTitlePaperContentBox
								? [CTitlePaperContentBox]
								: []),
					]}
					data-testid="hello"
				>
					{children}
				</Box>
			</Stack>
		</CBasePaper>
	);
}

export default CTitlePaper;
