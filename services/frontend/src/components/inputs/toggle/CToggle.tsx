import { ToggleButton, ToggleButtonGroup, type ToggleButtonGroupProps } from "@mui/material";
import type { GCompProps } from "../../common/GProps";
import type { TOption } from "../../../types/data";
import React, { useId } from "react";
import { CToggleButtonStyle } from "../../../styles/components/inputs/CToggleStyle";
import CText from "../../text/CText";
import type { TSize } from "../../../types/string";

interface CToggleProps extends GCompProps, ToggleButtonGroupProps {
	options: TOption[];
	value: string;
	onValueChanged?: (value: string) => void;
	fontSize?: TSize;
	padding?: string;
	allowUnselect?: boolean;
}

function CToggle({
	options,
	value,
	onValueChanged,
	fontSize,
	padding,
	allowUnselect = true,
	...other
}: CToggleProps) {
	const localID: string = useId();

	const handleChange = (_: React.MouseEvent<HTMLElement>, nValue: string) => {
		if (!nValue && !allowUnselect) return;
		if (onValueChanged) onValueChanged(nValue);
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
					<ToggleButton
						sx={[
							{ padding: padding },
							...(Array.isArray(CToggleButtonStyle)
								? CToggleButtonStyle
								: CToggleButtonStyle
									? [CToggleButtonStyle]
									: []),
						]}
						value={item.value}
						key={localID + "-" + index}
					>
						{item.icon}
						<CText size={fontSize}>{item.label}</CText>
					</ToggleButton>
				);
			})}
		</ToggleButtonGroup>
	);
}

export default CToggle;
