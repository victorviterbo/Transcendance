import { type TypographyVariant } from "@mui/material";
import type { CTextBaseProps } from "./CTextBase.tsx";
import CTextBase from "./CTextBase.tsx";
import { appTexts } from "../../styles/theme.ts";

interface CTextProps extends CTextBaseProps {}

function CText({ size, sx, children, ...other }: CTextProps) {
	//====================== FUNCTIONS ======================
	const getVariant: () => TypographyVariant = () => {
		switch (size) {
			case "sm":
				return "body1";
			case "md":
				return "body1";
			case "lg":
				return "body1";
		}
		return "body1";
	};

	function getSize(): number {
		if (!size) return appTexts.text.sizes.md;
		if (!(size in appTexts.text.sizes)) return appTexts.text.sizes.md;
		return appTexts.text.sizes[size];
	}

	return (
		<CTextBase
			sx={[
				{ fontFamily: appTexts.text.mainFamily },
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			getVariant={getVariant}
			getSize={getSize}
			{...other}
		>
			{children}
		</CTextBase>
	);
}

export default CText;
