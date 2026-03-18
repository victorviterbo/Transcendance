import { type TypographyVariant } from "@mui/material";
import type { CTextBaseProps } from "./CTextBase.tsx";
import CTextBase from "./CTextBase.tsx";

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

	return (
		<CTextBase
			getVariant={getVariant}
			sx={[
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
				(Theme) => ({
					fontFamily: "DynaPuff, " + Theme.typography.fontFamily,
					fontWeight: 700,
					lineHeight: 0.95,
					letterSpacing: "0.03em",
					textShadow: "0 4px 0 rgba(23, 15, 56, 0.22)",
				}),
			]}
			{...other}
		>
			{children}
		</CTextBase>
	);
}

export default CTitle;
