import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type { GCompProps } from "../../common/GProps";
import { CTextFieldStyle } from "../../../styles/components/inputs/CTextFieldStyle";

export interface CTextFieldProps extends GCompProps, Omit<TextFieldProps, "variant"> {}

function CTextField({ sx, ...other }: CTextFieldProps) {
	return (
		<TextField
			margin="normal"
			sx={[CTextFieldStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		></TextField>
	);
}

export default CTextField;
