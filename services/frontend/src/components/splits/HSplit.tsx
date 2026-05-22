import { Box } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import { appColors } from "../../styles/theme";

interface HSplitProps extends GCompProps {
	width?: string | number;
	color?: string;
}

function HSplit({ width, color }: HSplitProps) {
	return (
		<Box
			sx={{
				mt: "2%",
				width: width == undefined ? "3px" : typeof width == "number" ? width + "px" : width,
				backgroundColor: color ? color : appColors.greys[5],
			}}
		></Box>
	);
}

export default HSplit;
