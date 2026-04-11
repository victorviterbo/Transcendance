import type { Theme } from "@mui/material";
import { colorAlterColor, colorGetBackground } from "../../../utils/styles";
import { appColors, appSharedStyle } from "../../theme";
import type { TMessageStatus } from "../../../types/friends";

export function PFriendChatNodeStyle(_: Theme, isUser: boolean) {
	let bgColors: string[] = [];

	if (isUser)
		bgColors = [
			appColors.primary[0],
			colorAlterColor(appColors.primary[0], ["shift-hue", "shift-brightness"], [30, 0.15]),
		];
	else
		bgColors = [
			appColors.secondary[0],
			colorAlterColor(appColors.secondary[0], "shift-hue", -30),
		];

	return {
		background: colorGetBackground([bgColors[0], bgColors[1]], undefined, "linear", 160),

		maxWidth: "80%",

		color: appColors.text.dark,

		p: "15px",
		mb: "10px",
		ml: isUser ? "auto" : 0,
		mr: isUser ? 0 : "auto",

		borderRadius: appSharedStyle.radius + "px",
	};
}

export function PFriendChatNodeDateStyle(_: Theme, isUser: boolean) {
	return {
		mr: isUser ? "5px" : 0,
	};
}
export function PFriendChatNodeErrorStyle(_: Theme) {
	return {
		color: "red",
	};
}

export function PFriendChatNodeStatusStyle(_: Theme, status: TMessageStatus) {
	return {
		color:
			status == "error"
				? "red"
				: status == "read"
					? appColors.secondary[0]
					: appColors.text.dark,
		ml: "auto",
	};
}
