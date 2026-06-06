import { CircularProgress, type CircularProgressProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";

export interface CCircularProgressProps extends Omit<CircularProgressProps, "color">, GCompProps {
	color?: string;
}

function CCircularProgress({sx, color, ...other }: CCircularProgressProps) {
	return <CircularProgress  sx={[{color: color}, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...other}></CircularProgress>;
}

export default CCircularProgress;
