import { useCallback, useEffect, useRef, useState } from "react";
import type { CLinearProgressProps } from "./CLinearProgress";
import CLinearProgress from "./CLinearProgress";

interface CCountdownLinearProps extends Omit<CLinearProgressProps, "min" | "max" | "value"> {
	startTime: number;
	timeMS: number;
	updateStep?: number;
	inverse?: boolean;
}

function CCountdownLinear({
	timeMS,
	startTime,
	inverse,
	sx,
	updateStep = 10,
	...other
}: CCountdownLinearProps) {
	const [current, setCurrent] = useState<number>(timeMS);
	const to = useRef<number>(-1);

	const updateCurrent = useCallback(
		function tick() {
			let result = timeMS - (Date.now() - startTime);
			if (result < 0) result = 0;
			setCurrent(inverse ? timeMS - result : result);
			if (result == 0) return;
			to.current = setTimeout(tick, updateStep);
		},
		[setCurrent, startTime, timeMS, updateStep, inverse],
	);

	useEffect(() => {
		if (to.current >= 0) {
			clearTimeout(to.current);
			to.current = -1;
		}
		to.current = setTimeout(updateCurrent, updateStep);
	}, [to, updateStep, updateCurrent]);

	useEffect(() => {
		if (to.current >= 0) {
			clearTimeout(to.current);
			to.current = -1;
		}
		function updateCurrent() {
			let result = timeMS - (Date.now() - startTime);
			if (result < 0) result = 0;
			setCurrent(inverse ? timeMS - result : result);
			if (result == 0) return;
			to.current = setTimeout(updateCurrent, updateStep);
		}
		to.current = setTimeout(updateCurrent, updateStep);
	}, [to, startTime, timeMS, updateStep, setCurrent, inverse]);

	return (
		<CLinearProgress
			sx={[
				{
					"& .MuiLinearProgress-bar": {
						transition: "none", //"stroke-dashoffset " + updateStep + "ms linear 0ms"
					},
				},
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			min={0}
			value={current}
			max={timeMS}
			{...other}
		></CLinearProgress>
	);
}

export default CCountdownLinear;
