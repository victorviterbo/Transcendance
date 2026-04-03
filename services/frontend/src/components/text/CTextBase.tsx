import type { GCompProps } from "../common/GProps";
import type { TAlign, TSize, TVAlign } from "../../types/string.ts";
import { Typography, type TypographyOwnProps, type TypographyVariant } from "@mui/material";
import { ttr } from "../../localization/localization.ts";
import { Children } from "react";

export interface CTextBaseProps extends GCompProps, TypographyOwnProps {
	align?: TAlign;
	vAlign?: TVAlign;

	size?: TSize;
	weight?: number;

	color?: string;
	family?: string;

	span?: boolean;

	getVariant?: () => TypographyVariant;
	getSize?: () => number;
}

function CTextBase({
	align,
	vAlign,
	weight,
	children,
	color,
	family,
	span,
	getVariant,
	getSize,
	sx,
	testid,
	...other
}: CTextBaseProps) {
	const getChildren = () => {
		if (typeof children === "string") {
			if (span) return <span>{ttr(children)}</span>;
			return ttr(children);
		}
		const mapped = Children.map(children, (child) => {
			if (typeof child === "string") {
				if (span) return <span>{ttr(child)}</span>;
				return ttr(child);
			}
			return child;
		});

		return mapped;
	};

	//====================== DOM ======================
	return (
		<Typography
			variant={getVariant ? getVariant() : "body1"}
			align={align}
			gutterBottom
			sx={[
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
				{
					fontFamily: family,
					verticalAlign: vAlign,
					color: color,
					fontSize: getSize ? getSize() + "px" : undefined,
					fontWeight: weight,
				},
			]}
			{...other}
			data-testid={testid ? testid : "CTextBase"}
		>
			{getChildren()}
		</Typography>
	);
}

export default CTextBase;
