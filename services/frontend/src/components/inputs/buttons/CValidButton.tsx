import { appColors } from "../../../styles/theme";
import type { CIconButtonProps } from "./CIconButton";
import CIconButton from "./CIconButton";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface CValidButtonProps extends CIconButtonProps {
	fontSize?: "large" | "medium" | "small";
}

function CValidButton({ sx, fontSize, ...other }: CValidButtonProps) {
	return (
		<CIconButton
			sx={[
				{ background: appColors.validate[1] },
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			<CheckCircleIcon fontSize={fontSize} />
		</CIconButton>
	);
}

export default CValidButton;
