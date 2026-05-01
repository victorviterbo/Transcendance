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

	//POSITIONS
	contentFlex?: number;
	isFlex?: boolean;
	overflow?: TOverflow;
	position?: TPosition;

	//STYLING
	borderRadius?: number | string;
	titlePadding?: number | string;
	contentPadding?: number | string;
}

function CTitleBasePaper(props: CTitleBasePaperProps) {
	const {
		titleNode,
		children,

		contentFlex,
		isFlex,
		overflow,
		position,

		borderRadius,
		titlePadding,
		contentPadding,

		sx,
		...other
	} = props;

	return (
		<CBasePaper
			sx={[
				CTitlePaperStyle({ borderRadius, titlePadding, contentPadding }),
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			<Stack sx={{ overflow: "hidden", flex: 1, alignItems: "stretch" }}>
				<Box
					sx={CTitlePaperTitleBoxStyle({ borderRadius, titlePadding, contentPadding })}
					data-testid="CTitleBasePaper_Title"
				>
					{titleNode}
				</Box>
				<Box
					sx={[
						position ? { position: position } : {},
						isFlex ? { display: "flex", flexDirection: "column" } : {},
						{ overflow: overflow, flex: contentFlex },
						CTitlePaperContentBox({ borderRadius, titlePadding, contentPadding }),
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
