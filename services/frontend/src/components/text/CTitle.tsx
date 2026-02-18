import { type TypographyVariant } from "@mui/material";
import type { CTextBaseProps } from "./CTextBase.tsx";
import CTextBase from "./CTextBase.tsx";

interface CButtonProps extends CTextBaseProps {}

function CTitle({ size, children, ...other }: CButtonProps) {
	//====================== FUNCTIONS ======================
	const getVariant: () => TypographyVariant = () => {
		switch (size) {
			case "sm":
				return "h6";
			case "md":
				return "h4";
			case "lg":
				return "h2";
		}
		return "h6";
	};

	return (
		<CTextBase getVariant={getVariant} {...other}>
			{children}
		</CTextBase>
	);
}

export default CTitle;
