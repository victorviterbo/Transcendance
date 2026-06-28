import type { SxProps, Theme } from "@mui/material";
import { appColors, appTexts } from "../../theme";
import type { TSize } from "../../../types/string";

export interface ITabStyle {
	main: SxProps<Theme>;
}

export const CTabStyle = (size: TSize): ITabStyle => {
	return {
		main: {
			color: appColors.text.light,
			fontSize: appTexts.text.sizes[size as TSize] + "px",
		},
	};
};
