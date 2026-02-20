import CButton, { type CButtonProps } from "./CButton";
import TranslateIcon from "@mui/icons-material/Translate";

interface CButtonLanguageProps extends CButtonProps {}

function CButtonLanguage({ ...other }: CButtonLanguageProps) {
	return <CButton {...other} variant="contained" startIcon={<TranslateIcon />}></CButton>;
}

export default CButtonLanguage;
