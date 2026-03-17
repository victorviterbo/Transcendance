import type { SxProps, Theme } from "@mui/material";
import type { CDrawerProps } from "../../../components/navigation/CDrawer";
import { sizeMakeString } from "../../../utils/styles";

export const CDrawerStyle = ({ width, margin }: CDrawerProps): SxProps<Theme> => {
	console.log(margin);
	return {
		top: sizeMakeString(margin?.top),
		right: sizeMakeString(margin?.right),
		width: sizeMakeString(width),

		"& .MuiDrawer-paper": {
			boxShadow: "0px 0px 0px 0px black",
			borderLeft: "solid 0px black",
			top: sizeMakeString(margin?.top),
			right: sizeMakeString(margin?.right),
			width: sizeMakeString(width),
			height:
				sizeMakeString(margin?.top) == "inherit" ||
				sizeMakeString(margin?.bottom) == "inherit"
					? null
					: "calc(100% - " +
						sizeMakeString(margin?.top) +
						" - " +
						sizeMakeString(margin?.bottom) +
						")",
		},
	};
};
