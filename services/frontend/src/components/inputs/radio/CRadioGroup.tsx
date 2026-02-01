import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material"
import { useId } from "react"
import type { GCompProps } from "../../common/GProps";
import type { TOption } from "../../../types/data";

export interface CRadioGroupProps extends GCompProps {
	label?: string;
	options: TOption[];
	defaultValue?: string;
}

function CRadioGroup({label, options, defaultValue}: CRadioGroupProps) {

	//====================== VALUES ======================
	let localID: string = useId();


	//====================== DOM ======================
	return <FormControl>
		{label && <FormLabel id={localID}>{label}</FormLabel>}
		<RadioGroup
			aria-labelledby={localID}
			defaultValue={defaultValue ? defaultValue : null}
		>
			{
				options.map((item: TOption) => {
					return <FormControlLabel value={item.value} control={<Radio />} label={item.label} />
				})
			}
		</RadioGroup>
	</FormControl>
}

export default CRadioGroup