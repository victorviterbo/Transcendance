import { Box, Stack } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";
import {
	CTitlePaperContentBox,
	CTitlePaperStyle,
	CTitlePaperTitleBoxStyle,
} from "../../styles/components/surfaces/CTitlePaper";

import type { TOverflow, TPosition } from "../../types/string";
import type { ReactNode } from "react";

export interface CTitleBasePaperProps extends GCompProps, CBasePaperProps {
	titleNode: ReactNode;

	contentFlex?: number;
	isFlex?: boolean;
	overflow?: TOverflow;
	position?: TPosition;
}

function CTitleBasePaper({
	titleNode,
	children,

	contentFlex,
	isFlex,
	overflow,
	position,

	sx,
	...other
}: CTitleBasePaperProps) {
	return (
		<CBasePaper
			sx={[CTitlePaperStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		>
			<Stack sx={{ overflow: "hidden", flex: 1, alignItems: "stretch" }}>
				<Box sx={CTitlePaperTitleBoxStyle} data-testid="CTitleBasePaper_Title">
					{titleNode}
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

export default CTitleBasePaper;
