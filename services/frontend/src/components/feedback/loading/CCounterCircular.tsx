import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import CCircularProgress, { type CCircularProgressProps } from "./CCircularProgress";
import CText from "../../text/CText";
import { useMemo } from "react";

interface CCounterCircularProps extends CCircularProgressProps {
	min: number;
	max: number;

	stackSx?: SxProps<Theme>;
}

function CCounterCircular({ min, max, sx, stackSx, value, ...other }: CCounterCircularProps) {
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
			<Box sx={{ position: "relative" }}>
				<Stack
					sx={{
						position: "absolute",
						inset: 0,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<CText>{value}</CText>
				</Stack>
				<CCircularProgress
					sx={[{}, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
					value={currentPer}
					{...other}
				></CCircularProgress>
			</Box>
		</Stack>
	);
}

export default CCounterCircular;
