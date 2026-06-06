import { useCallback, useEffect, useRef, useState } from "react";
import type { CCounterCircularProps } from "./CCounterCircular";
import CCounterCircular from "./CCounterCircular";
import { colorGetAtPos } from "../../../utils/styles";

interface CCountdownCircularProps extends Omit<CCounterCircularProps, "min" | "max" | "value"> {
	startTime: number;
	timeMS: number;
	updateStep?: number;
	startColor?: string;
	endColor?: string
}

function CCountdownCircular({timeMS, sx, updateStep = 10,  startTime, startColor, endColor, ...other}: CCountdownCircularProps) {

	const [current, setCurrent] = useState<number>(timeMS);
	const [displayed, setDisplayed] = useState<string>(Math.trunc(timeMS / 1000).toString());
	const to = useRef<number>(-1);

	const getColor = useCallback((): undefined | string => {
		if(!startColor)
			return undefined;
		if(!endColor)
			return startColor;
		return  colorGetAtPos(startColor, endColor, 1.0 - current / timeMS)
	}, [startColor, endColor, current, timeMS])
	

	useEffect(() => {
		if(to.current >= 0)
		{
			clearTimeout(to.current);
			to.current = -1;
		}
		function updateCurrent() {

			let result = timeMS - (Date.now() - startTime);
			if(result < 0)
				result = 0;
			setCurrent(result)
			setDisplayed((result == 0 ? 0 : (result == timeMS ? Math.trunc(timeMS / 1000) : (Math.trunc(result / 1000) + 1))).toString())
			if(result == 0)
				return;
			to.current = setTimeout(updateCurrent, updateStep)
		}
		to.current = setTimeout(updateCurrent, updateStep)
	}, [to, startTime, timeMS, updateStep, setCurrent, setDisplayed])

	return <CCounterCircular color={getColor()} sx={[{
		"& .MuiCircularProgress-circle": {
			transition: "none"//"stroke-dashoffset " + updateStep + "ms linear 0ms"
		}
	}, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} min={0} value={current} max={timeMS} displayedValue={displayed} {...other}></CCounterCircular>
}

export default CCountdownCircular;