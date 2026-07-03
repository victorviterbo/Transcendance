import type { SxProps, Theme } from "@mui/material";
import { colorAlterColor, colorGetBackground } from "../../../utils/styles";
import { appAnimation, appColors, appSharedStyle } from "../../theme";
import type { PFriendNodeProps } from "../../../pages/PSocial/PFriendNode";
import type { IFriendInfo } from "../../../types/socials";

export interface IFriendNodeStyle {
	main: SxProps<Theme>;
	avatar: SxProps<Theme>;
	text: SxProps<Theme>;
	name: SxProps<Theme>;
	badge: SxProps<Theme>;
	message: SxProps<Theme>;
}

export const PFriendNodeStyle = (theme: Theme, props: PFriendNodeProps): IFriendNodeStyle => {
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
		main: {
			background: colorGetBackground([bgColors[0], bgColors[1]], undefined, "linear", 160),
			p: { xs: "5px", tn: "7px", sm: "10px" },
			mb: "10px",

			opacity: props.hidden ? 0 : 1,
			borderRadius: appSharedStyle.radius,

			transition: theme.transitions.create(["opacity"], {
				duration: appAnimation.timing.medium_slow,
			}),
		},
		avatar: {
			width: { xs: "30px", tn: "40px", sm: "50px" },
			height: { xs: "30px", tn: "40px", sm: "50px" },
		},
		text: {
			flex: 1,
			mx: { xs: "5px", tn: "10px", sm: "15px" },
			justifyContent: "center",
			alignItems: "stretch",
			overflow: "hidden",
		},
		name: {
			m: 0,
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			overflow: "hidden",
		},
		badge: {
			m: 0,
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			overflow: "hidden",
		},
		message: {
			mt: "auto",
			mb: "auto",
		},
	};
};
