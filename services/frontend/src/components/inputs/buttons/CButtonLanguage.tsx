import { type IconButtonProps } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import CIconButton from "./CIconButton";
import { appPositions } from "../../../styles/theme";

interface CButtonLanguageProps extends Omit<IconButtonProps, "children" | "aria-label"> {}

function CButtonLanguage({ sx, ...other }: CButtonLanguageProps) {
	return (
		<CIconButton
			{...other}
			aria-label="Language selection"
			sx={[
				{
					height: appPositions.sizes.buttons.nav,
				},
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
		>
			<TranslateIcon />
		</CIconButton>
	);
}

export default CButtonLanguage;
