import type { GCompProps } from "../common/GProps";
import type { TAlign, TSize } from "../../types/string.ts";
import { Typography, type TypographyOwnProps, type TypographyVariant } from "@mui/material";
import { ttr } from "../../localization/localization.ts";
import { Children } from "react";

export interface CTextBaseProps extends GCompProps, TypographyOwnProps {
	align?: TAlign;
	size?: TSize;
	color?: string;

	span?: boolean;

	getVariant?: () => TypographyVariant;
}

function CTextBase({ align, span, children, color, getVariant, sx, ...other }: CTextBaseProps) {
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
			sx={[...(Array.isArray(sx) ? sx : sx ? [sx] : []), { color: color }]}
			{...other}
			data-testid={"CTextBase"}
		>
			{getChildren()}
		</Typography>
	);
}

export default CTextBase;
