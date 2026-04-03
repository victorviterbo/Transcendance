import { type TypographyVariant } from "@mui/material";
import type { CTextBaseProps } from "./CTextBase.tsx";
import CTextBase from "./CTextBase.tsx";
import { appTexts } from "../../styles/theme.ts";

export interface CTitleProps extends CTextBaseProps {}

function CTitle({ size, children, sx, ...other }: CTitleProps) {
	//====================== FUNCTIONS ======================
	const getVariant: () => TypographyVariant = () => {
		switch (size) {
			case "sm":
				return "h5";
			case "md":
				return "h4";
			case "lg":
				return "h2";
		}
		return "h6";
	};

	function getSize(): number {
		if (!size) return appTexts.title.sizes.md;
		if (!(size in appTexts.title.sizes)) return appTexts.title.sizes.md;
		return appTexts.title.sizes[size];
	}

	return (
		<CTextBase
			getVariant={getVariant}
			getSize={getSize}
			sx={[
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
				(_) => ({ fontFamily: appTexts.title.mainFamily }),
			]}
			{...other}
		>
			{children}
		</CTextBase>
	);
}

export default CTitle;
