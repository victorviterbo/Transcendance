import type { GCompProps } from "../common/GProps";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";

interface CHomePaperProps extends GCompProps, CBasePaperProps {}

function CHomePaper({ ...other }: CHomePaperProps) {
	return <CBasePaper {...other}></CBasePaper>;
}

export default CHomePaper;
