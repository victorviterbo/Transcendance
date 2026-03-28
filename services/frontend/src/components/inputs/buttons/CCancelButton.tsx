import { appColors } from "../../../styles/theme";
import type { CIconButtonProps } from "./CIconButton";
import CIconButton from "./CIconButton";
import CancelIcon from "@mui/icons-material/Cancel";

interface CCancelButtonProps extends CIconButtonProps {}

function CCancelButton({ sx, ...other }: CCancelButtonProps) {
	return (
		<CIconButton
			sx={[{ background: appColors.cancel[0] }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		>
			<CancelIcon />
		</CIconButton>
	);
}

export default CCancelButton;
