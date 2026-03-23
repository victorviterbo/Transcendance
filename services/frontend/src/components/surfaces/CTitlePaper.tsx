import type { GCompProps } from "../common/GProps";
import CText from "../text/CText";
import { CTitlePaperTitleStyle } from "../../styles/components/surfaces/CTitlePaper";

import type { TOverflow, TSize } from "../../types/string";
import CTitle from "../text/CTitle";
import type { CTitleBasePaperProps } from "./CTitleBasePaper";
import CTitleBasePaper from "./CTitleBasePaper";

export interface CTitlePaperProps extends GCompProps, Omit<CTitleBasePaperProps, "titleNode"> {
	title: string;
	titleType?: "text" | "title";
	titleSize?: TSize;

	contentFlex?: number;
	isFlex?: boolean;
	overflow?: TOverflow;
}

function CTitlePaper({ title, titleType, titleSize, children, ...other }: CTitlePaperProps) {
	return (
		<CTitleBasePaper
			titleNode={
				titleType == undefined || titleType == "text" ? (
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
				)
			}
			{...other}
		>
			{children}
		</CTitleBasePaper>
	);
}

export default CTitlePaper;
