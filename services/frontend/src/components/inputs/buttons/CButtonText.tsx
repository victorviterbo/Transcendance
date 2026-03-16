import type { CButtonProps } from "./CButton";
import CButton from "./CButton";

interface CButtonTextProps extends CButtonProps {}

//<Button variant="contained" {...other} sx={{ width: "fit-content", minWidth: "auto" }}>

function CButtonText({ sx, children, ...other }: CButtonTextProps) {
	return (
		<CButton
			sx={[
				{
					width: "fit-content",
					minWidth: "auto",
				},
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			{children}
		</CButton>
	);
}

export default CButtonText;
