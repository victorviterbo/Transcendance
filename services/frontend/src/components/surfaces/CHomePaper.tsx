import CBasePaper, { type CBasePaperProps } from "./CBasePaper";

interface CHomePaperProps extends CBasePaperProps {}

function CHomePaper({ ...other }: CHomePaperProps) {
	return <CBasePaper {...other}></CBasePaper>;
}

export default CHomePaper;
