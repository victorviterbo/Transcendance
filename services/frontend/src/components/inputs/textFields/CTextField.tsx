import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type { GCompProps } from "../../common/GProps";

export interface CTextFieldProps extends GCompProps, Omit<TextFieldProps, "variant"> {}

function CTextField({ slotProps, ...other }: CTextFieldProps) {
	return (
		<TextField
			slotProps={{
				...slotProps,
				inputLabel: {
					sx: (theme) => ({
						"&.Mui-focused": {
							color:
								theme.palette.mode == "dark"
									? theme.palette.secondary.main
									: theme.palette.secondary.light,
						},
					}),
				},
				input: {
					sx: (theme) => ({
						"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
							borderColor:
								theme.palette.mode == "dark"
									? theme.palette.secondary.main
									: theme.palette.secondary.light,
						},
					}),
				},
			}}
			{...other}
		></TextField>
	);
}

export default CTextField;
