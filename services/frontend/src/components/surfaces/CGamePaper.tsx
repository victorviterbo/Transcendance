import type { GCompProps } from "../common/GProps";
import CTitle from "../text/CTitle";
import type { CTitleBasePaperProps } from "./CTitleBasePaper";
import CTitleBasePaper from "./CTitleBasePaper";
import { appSharedStyle } from "../../styles/theme";
import { CGamePaperTitleStyle } from "../../styles/components/surfaces/CTitlePaper";

export interface CGameBasePaperProps extends GCompProps, Omit<CTitleBasePaperProps, "titleNode"> {
	title: string;
}

function CGamePaper({ title,  ...other }: CGameBasePaperProps) {

	return (
		<CTitleBasePaper sx={{height: "100%"}} titlePadding="0px" borderRadius={appSharedStyle.gameRadius} titleNode={
				<CTitle sx={CGamePaperTitleStyle} align={"center"} size="2xs" weight={100}>
					{title}
				</CTitle>
		} {...other}></CTitleBasePaper>
	);
}

export default CGamePaper;
