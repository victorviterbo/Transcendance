import type { SxProps, Theme } from "@mui/material";
import type { PNotifNodeProps } from "../../../pages/PNotif/PNotifNode";
import { appColors, appSharedStyle } from "../../theme";
import { colorGetBackground } from "../../../utils/styles";

export function PNotifNodeStyle(_: Theme, { notif }: PNotifNodeProps) {
	let bgColors: string[] = [];

	if (notif.read) bgColors = [appColors.greys[3], appColors.greys[5]];
	else bgColors = [appColors.quinary[0], appColors.primary[0]];

	return {
		background: colorGetBackground([bgColors[0], bgColors[1]], undefined, "linear", 160),
		p: "15px",
		mb: "10px",

		borderRadius: appSharedStyle.radius,
	};
}

export const PNotifNodeImpText: SxProps<Theme> = (_) => ({
	ml: "5px",
	color: appColors.secondary[0],
});

export const PNotifNodeSeeButton: SxProps<Theme> = (_) => ({
	ml: "auto",
	my: "auto",
});
