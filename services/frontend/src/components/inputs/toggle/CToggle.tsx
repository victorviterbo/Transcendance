import { ToggleButton, ToggleButtonGroup, type ToggleButtonGroupProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import type { TOption } from "../../../types/data";
import React, { useId, useState } from "react";
import { ttr } from "../../../localization/localization";

interface CToggleProps extends GCompProps, ToggleButtonGroupProps {
	options: TOption[];
}

function CToggle({ options, ...other }: CToggleProps) {
	const localID: string = useId();
	const [value, setValue] = useState<string>(options.length > 0 ? options[0].value : "");

	const handleChange = (_: React.MouseEvent<HTMLElement>, nValue: string) => {
		setValue(nValue);
	};

	return (
		<ToggleButtonGroup
			value={value}
			color="secondary"
			exclusive
			{...other}
			onChange={handleChange}
		>
			{options.map((item: TOption, index: number) => {
				return (
					<ToggleButton value={item.value} key={localID + "-" + index}>
						{ttr(item.label)}
					</ToggleButton>
				);
			})}
		</ToggleButtonGroup>
	);
}

export default CToggle;
