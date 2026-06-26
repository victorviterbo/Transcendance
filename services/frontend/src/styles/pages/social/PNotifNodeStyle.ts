import type { SxProps, Theme } from "@mui/material";
import type { PNotifNodeProps } from "../../../pages/PNotif/PNotifNode";
import { appColors, appSharedStyle } from "../../theme";
import { colorGetBackground } from "../../../utils/styles";

export interface INotifNodeStyle {
	main: SxProps<Theme>;
	impText: SxProps<Theme>;
	button: SxProps<Theme>;
}

export function PNotifNodeStyle({ notif }: PNotifNodeProps): INotifNodeStyle {
	let bgColors: string[] = [];

	if (notif.read) bgColors = [appColors.greys[3], appColors.greys[5]];
	else bgColors = [appColors.quinary[0], appColors.primary[0]];

	return {
		main: {
			background: colorGetBackground([bgColors[0], bgColors[1]], undefined, "linear", 160),
			p: "15px",
			mb: "10px",

			borderRadius: appSharedStyle.radius + "px",
		},

		impText: {
			ml: "5px",
			color: appColors.secondary[0],
		},

		button: {
			ml: "auto",
			my: "auto",
		},
	};
}
