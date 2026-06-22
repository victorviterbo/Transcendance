import { LinearProgress, type LinearProgressProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import { useMemo } from "react";

export interface CLinearProgressProps extends GCompProps, Omit<LinearProgressProps, "variant"> {
	min: number;
	max: number;
}

function CLinearProgress({ value, min, max, ...other }: CLinearProgressProps) {
	const currentPer: number = useMemo((): number => {
		if (value == undefined) return 0;
		if (value < min) return 0;
		if (value > max) return 100;
		return ((value - min) / (max - min)) * 100;
	}, [value, min, max]);

	return <LinearProgress value={currentPer} variant="determinate" {...other} />;
}

export default CLinearProgress;
