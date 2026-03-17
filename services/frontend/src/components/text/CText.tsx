import { type TypographyVariant } from "@mui/material";
import type { CTextBaseProps } from "./CTextBase.tsx";
import CTextBase from "./CTextBase.tsx";

interface CTextProps extends CTextBaseProps {}

function CText({ size, children, ...other }: CTextProps) {
	//====================== FUNCTIONS ======================
	const getVariant: () => TypographyVariant = () => {
		switch (size) {
			case "sm":
				return "body2";
			case "md":
				return "body1";
			case "lg":
				return "h6";
		}
		return "h6";
	};

	return (
		<CTextBase getVariant={getVariant} {...other}>
			{children}
		</CTextBase>
	);
}

export default CText;
