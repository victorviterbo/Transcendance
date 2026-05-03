import type { SxProps, Theme } from "@mui/material";
import { appColors } from "../../theme";

export const PGameChatSendStack = () => {
	return {
		background: appColors.primary[2],
		px: "7px",
		py: "10px",
		boxShadow: "0px 0px 2px 1px " + appColors.greys[5],
	};
};

export const PGameChatNodeStyle = (): SxProps<Theme> => {
	return {
		px: "10px",
	};
};
