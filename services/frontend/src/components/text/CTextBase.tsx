import type { GCompProps } from "../common/GProps";
import type { TAlign, TSize } from "../../types/string.ts";
import { Typography, type TypographyOwnProps, type TypographyVariant } from "@mui/material";
import { ttr } from "../../localization/localization.ts";
import { Children } from "react";

export interface CTextBaseProps extends GCompProps, TypographyOwnProps {
	align?: TAlign;
	size?: TSize;

	getVariant?: () => TypographyVariant;
}

function CTextBase({ align, children, getVariant, ...other }: CTextBaseProps) {
	//====================== DOM ======================
	return (
		<Typography
			variant={getVariant ? getVariant() : "body1"}
			align={align}
			gutterBottom
			{...other}
		>
			{typeof children === "string"
				? ttr(children)
				: Children.map(children, (child) =>
						typeof child === "string" ? ttr(child) : child,
					)}
		</Typography>
	);
}

export default CTextBase;
