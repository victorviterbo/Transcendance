import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type { GCompProps } from "../../common/GProps";
import { CTextFieldStyle } from "../../../styles/components/inputs/CTextFieldStyle";

export interface CTextFieldProps extends GCompProps, Omit<TextFieldProps, "variant"> {
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;

	borderWidth?: string;
	borderRadius?: string;
	verticalPadding?: string;
}

function CTextField({
	sx,
	fontFamily,
	fontSize,
	fontWeight,
	borderWidth,
	borderRadius,
	verticalPadding,
	...other
}: CTextFieldProps) {
	return (
		<TextField
			margin="normal"
			sx={[
				(theme) =>
					CTextFieldStyle(theme, {
						fontFamily,
						fontSize,
						fontWeight,
						verticalPadding,
						borderRadius,
						borderWidth,
					}),
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		></TextField>
	);
}

export default CTextField;
