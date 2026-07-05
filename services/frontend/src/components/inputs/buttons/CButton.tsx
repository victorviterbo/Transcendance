import { Button, type ButtonProps } from "@mui/material";
import type { GProps } from "../../common/GProps.ts";
import { CButtonStyle } from "../../../styles/components/inputs/CButtonStyle.ts";
import { useLang } from "../../contexts/CLanguageProvider.tsx";

export interface CButtonProps extends GProps, ButtonProps {}

function CButton({ children, sx, ...other }: CButtonProps) {
	const { ttr } = useLang();

	return (
		<Button
			variant="contained"
			sx={[CButtonStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		>
			{typeof children == "string" ? <span>{ttr(children)}</span> : children}
		</Button>
	);
}

export default CButton;
