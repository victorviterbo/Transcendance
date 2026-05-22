import { CircularProgress, type CircularProgressProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";

export interface CCircularProgressProps extends CircularProgressProps, GCompProps {}

function CCircularProgress({ ...other }: CCircularProgressProps) {
	return <CircularProgress {...other}></CircularProgress>;
}

export default CCircularProgress;
