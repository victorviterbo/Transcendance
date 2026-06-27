import type { SxProps, Theme } from "@mui/material";
import { colorAlterColor, colorGetBackground } from "../../../utils/styles";
import { appAnimation, appColors, appSharedStyle } from "../../theme";
import type { PFriendNodeProps } from "../../../pages/PSocial/PFriendNode";
import type { IFriendInfo } from "../../../types/socials";

export function PFriendNodeStyle(theme: Theme, props: PFriendNodeProps) {
	let bgColors: string[] = [];

	if (props.type == "friend") {
		if ((props.user as IFriendInfo).status == "online")
			bgColors = [appColors.primary[0], appColors.quinary[0]];
		else if ((props.user as IFriendInfo).status == "busy")
			bgColors = [
				appColors.secondary[0],
				colorAlterColor(appColors.secondary[0], "shift-hue", -30),
			];
		else if ((props.user as IFriendInfo).status == "offline")
			bgColors = [appColors.greys[3], appColors.greys[5]];
	} else bgColors = [appColors.primary[0], appColors.quinary[0]];

	return {
		background: colorGetBackground([bgColors[0], bgColors[1]], undefined, "linear", 160),
		p: "10px",
		mb: "10px",

		opacity: props.hidden ? 0 : 1,
		borderRadius: appSharedStyle.radius,

		transition: theme.transitions.create(["opacity"], {
			duration: appAnimation.timing.medium_slow,
		}),
	};
}

export const PFriendNodeAvatarStyle: SxProps<Theme> = (_) => ({
	width: "50px",
	height: "50px",
});

export const PFriendNodeTextsStyle: SxProps<Theme> = (_) => ({
	flex: 1,
	mx: "15px",
	justifyContent: "center",
	alignItems: "stretch",
	overflow: "hidden",
});

export const PFriendNodeNameStyle: SxProps<Theme> = (_) => ({
	m: 0,
	whiteSpace: "nowrap",
	textOverflow: "ellipsis",
	overflow: "hidden",
});

export const PFriendNodeBadgeStyle: SxProps<Theme> = (_) => ({
	m: 0,
	whiteSpace: "nowrap",
	textOverflow: "ellipsis",
	overflow: "hidden",
});

export const PFriendNodeMessageStyle: SxProps<Theme> = (_) => ({
	mt: "auto",
	mb: "auto",
});
