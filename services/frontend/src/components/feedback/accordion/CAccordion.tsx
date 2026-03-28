import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	type AccordionProps,
	type SxProps,
	type Theme,
} from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CText from "../../text/CText";
import {
	CAccordionDetailsStyle,
	CAccordionStyle,
	CAccordionSummaryStyle,
} from "../../../styles/components/feedback/CAccordionStyle";
import type { TSize } from "../../../types/string";

export interface CAccordionProps extends GCompProps, AccordionProps {
	title: string;
	fontSize?: TSize;
	summarySX?: SxProps<Theme>;
	detailsSX?: SxProps<Theme>;
}

function CAccordion({
	sx,
	summarySX,
	detailsSX,
	title,
	fontSize,
	children,
	...other
}: CAccordionProps) {
	return (
		<Accordion sx={[CAccordionStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...other}>
			<AccordionSummary
				sx={[
					CAccordionSummaryStyle,
					...(Array.isArray(summarySX) ? summarySX : summarySX ? [summarySX] : []),
				]}
				expandIcon={<ExpandMoreIcon />}
				aria-controls="panel1-content"
				id="panel1-header"
			>
				<CText size={fontSize}>{title}</CText>
			</AccordionSummary>
			<AccordionDetails
				sx={[
					CAccordionDetailsStyle,
					...(Array.isArray(detailsSX) ? detailsSX : detailsSX ? [detailsSX] : []),
				]}
			>
				{children}
			</AccordionDetails>
		</Accordion>
	);
}

export default CAccordion;
