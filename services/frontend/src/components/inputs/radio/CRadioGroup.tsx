import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { useId } from "react";
import type { GCompProps } from "../../common/GProps";
import type { TOption } from "../../../types/data";

export interface CRadioGroupProps extends GCompProps {
	label?: string;
	options: TOption[];
	defaultValue?: string;

	onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

function CRadioGroup({ label, options, defaultValue, onChange }: CRadioGroupProps) {
	//====================== VALUES ======================
	const localID: string = useId();

	//====================== DOM ======================
	return (
		<FormControl>
			{label && <FormLabel id={localID}>{label}</FormLabel>}
			<RadioGroup
				aria-labelledby={localID}
				value={defaultValue ? defaultValue : null}
				onChange={(event: React.ChangeEvent<HTMLInputElement>, value: string) => {
					if (onChange) onChange(event, value);
				}}
			>
				{options.map((item: TOption) => {
					return (
						<FormControlLabel
							value={item.value}
							control={<Radio />}
							label={item.label}
							key={item.value}
						/>
					);
				})}
			</RadioGroup>
		</FormControl>
	);
}

export default CRadioGroup;
