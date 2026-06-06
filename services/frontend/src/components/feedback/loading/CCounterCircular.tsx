import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import CCircularProgress, { type CCircularProgressProps } from "./CCircularProgress";
import CText from "../../text/CText";
import { useMemo } from "react";
import type { TSize } from "../../../types/string";

export interface CCounterCircularProps extends CCircularProgressProps {
	min: number;
	max: number;

	displayedValue?: string;
	stackSx?: SxProps<Theme>;
	fontSize?: TSize;
}

function CCounterCircular({ min, max, displayedValue, sx, stackSx, fontSize, size, value, ...other }: CCounterCircularProps) {
	const currentPer: number = useMemo((): number => {
		if (value == undefined) return 0;
		if (value < min) return 0;
		if (value > max) return 100;
		return ((value - min) / (max - min)) * 100;
	}, [value, min, max]);

	return (
		<Stack
			sx={[
				{ alignItems: "center" },
				...(Array.isArray(stackSx) ? stackSx : stackSx ? [stackSx] : []),
			]}
		>
			<Box sx={{ height: typeof size == "number" ? (size + "px") : size, width: typeof size == "number" ? (size + "px") : size, position: "relative" }}>
				<Stack
					sx={{
						position: "absolute",
						inset: 0,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<CText sx={{m:0}} size={fontSize}>{displayedValue ? displayedValue : value}</CText>
				</Stack>
				<CCircularProgress
					sx={[{}, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
					value={currentPer}
					variant="determinate"
					size={size}
					{...other}
				></CCircularProgress>
			</Box>
		</Stack>
	);
}

export default CCounterCircular;
