import type { SxProps, Theme } from "@mui/material";
import type { CDrawerProps } from "../../../components/navigation/CDrawer";
import { sizeMakeString } from "../../../utils/styles";

export const CDrawerStyle = ({ width, top }: CDrawerProps): SxProps<Theme> => {
	return {

		
		top: sizeMakeString(top),
		width: sizeMakeString(width),
		

		"& .MuiDrawer-paper": {
			top: sizeMakeString(top),
			width: sizeMakeString(width),
			height: sizeMakeString(top) == "inherit" ? null : ("calc(100% - " + sizeMakeString(top) + ")"),

			border: "solid 4px black"
		},
	};
};
