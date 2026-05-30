import { Slider, type SliderProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";

interface CSliderProps extends SliderProps, GCompProps {}

function CSlider({ testid, ...other }: CSliderProps) {
	return <Slider {...other} data-testid={testid ? testid : "CSlider"} />;
}

export default CSlider;
