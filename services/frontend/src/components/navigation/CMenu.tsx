import { Menu, MenuItem, type MenuProps } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import type { TMenuOption } from "../../types/data";
import { useId } from "react";
import CText from "../text/CText";
import { CMenuItemStyle, CMenuStyle } from "../../styles/components/navigation/CMenuStyle";

interface CMenuProps extends GCompProps, MenuProps {
	options: TMenuOption[];
}

//TODO: Replace sx
function CMenu({ sx, options, ...other }: CMenuProps) {
	const localID = useId();

	return (
		<Menu sx={[CMenuStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...other}>
			{options.map((option: TMenuOption, index: number) => {
				return (
					<MenuItem
						key={localID + "-" + index}
						onClick={() => {
							if (option.action) option.action(option.value);
						}}
						sx={CMenuItemStyle}
					>
						<CText sx={{ width: "100%" }} size="sm" align="center">
							{option.label}
						</CText>
					</MenuItem>
				);
			})}
		</Menu>
	);
}

export default CMenu;
