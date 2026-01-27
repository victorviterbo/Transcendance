import { Typography, type TypographyVariant } from "@mui/material";
import type { ReactNode } from "react";
import type { GCompProps } from "../../components/common/GProps.tsx";
import type { TAlign, TSize } from "../../types/string.ts";

interface CButtonProps extends GCompProps {
	align?: TAlign;
	size?: TSize;
	children?: ReactNode;
}

function CTitle({ align, size, children }: CButtonProps) {
	//====================== FUNCTIONS ======================
	let getVariant: () => TypographyVariant = () => {
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

	//====================== DOM ======================
	return (
		<Typography variant={getVariant()} align={align} gutterBottom>
			{children}
		</Typography>
	);
}

export default CTitle;
