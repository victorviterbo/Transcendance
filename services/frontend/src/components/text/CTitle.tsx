import { type TypographyVariant } from "@mui/material";
import type { CTextBaseProps } from "./CTextBase.tsx";
import CTextBase from "./CTextBase.tsx";

export interface CTitleProps extends CTextBaseProps {}

function CTitle({ size, children, sx, ...other }: CTitleProps) {
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
		<CTextBase getVariant={getVariant} sx={[...(Array.isArray(sx) ? sx : sx ? [sx] : []), (Theme) => ({ fontFamily: "Knewave, " + Theme.typography.fontFamily})]} {...other}>
			{children}
		</CTextBase>
	);
}

export default CTitle;
