import {
	CAccordionSimpleDetailsStyle,
	CAccordionSimpleStyle,
	CAccordionSimpleSummaryStyle,
} from "../../../styles/components/feedback/CAccordionSimpleStyle";
import type { CAccordionProps } from "./CAccordion";
import CAccordion from "./CAccordion";

export interface CAccordionSimpleProps extends CAccordionProps {}

function CAccordionSimple({ sx, ...other }: CAccordionProps) {
	return (
		<CAccordion
			sx={[CAccordionSimpleStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			summarySX={CAccordionSimpleSummaryStyle}
			detailsSX={CAccordionSimpleDetailsStyle}
			{...other}
		></CAccordion>
	);
}

export default CAccordionSimple;
