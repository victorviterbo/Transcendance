import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type { GCompProps } from "../../common/GProps";
import { CTextFieldStyle } from "../../../styles/components/inputs/CTextFieldStyle";

export interface CTextFieldProps extends GCompProps, Omit<TextFieldProps, "variant"> {
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;
}

function CTextField(props: CTextFieldProps) {
	const { sx, ...other } = props;
	return (
		<TextField
			margin="normal"
			sx={[
				(theme) => CTextFieldStyle(theme, props),
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		></TextField>
	);
}

export default CTextField;
