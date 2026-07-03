import {
	CAccordionSimpleDetailsStyle,
	CAccordionSimpleStyle,
	CAccordionSimpleSummaryStyle,
} from "../../../styles/components/feedback/CAccordionSimpleStyle";
import { sxMerger } from "../../../utils/styles";
import type { CAccordionProps } from "./CAccordion";
import CAccordion from "./CAccordion";

export interface CAccordionSimpleProps extends CAccordionProps {}

function CAccordionSimple({ summarySX, detailsSX, sx, ...other }: CAccordionProps) {
	return (
		<CAccordion
			sx={[CAccordionSimpleStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			summarySX={sxMerger(CAccordionSimpleSummaryStyle, summarySX ? summarySX : {})}
			detailsSX={sxMerger(CAccordionSimpleDetailsStyle, detailsSX ? detailsSX : {})}
			{...other}
		></CAccordion>
	);
}

export default CAccordionSimple;
