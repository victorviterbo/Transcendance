import type { GCompProps } from "../common/GProps";
import type { TAlign, TSize } from "../../types/string.ts";
import { Typography, type TypographyOwnProps, type TypographyVariant } from "@mui/material";
import { ttr } from "../../localization/localization.ts";

export interface CTextBaseProps extends GCompProps, TypographyOwnProps {
	align?: TAlign;
	size?: TSize;

	getVariant?: () => TypographyVariant;
}

function CTextBase({ align, children, getVariant }: CTextBaseProps) {
	//====================== DOM ======================
	return (
		<Typography variant={getVariant ? getVariant() : "body1"} align={align} gutterBottom>
			{typeof children == "string" ? ttr(children) : children}
		</Typography>
	);
}

export default CTextBase;
