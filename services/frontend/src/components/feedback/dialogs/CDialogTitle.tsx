import { DialogTitle, type DialogTitleProps } from "@mui/material";
import { ttr } from "../../../localization/localization";
import { CDialogTitleStyle } from "../../../styles/components/feedback/CDialogTitleStyle";
import type { GProps } from "../../common/GProps";

export interface CDialogTitleProps extends GProps, DialogTitleProps {}

function CDialogTitle({ children, sx, ...other }: CDialogTitleProps) {
	return (
		<DialogTitle
			sx={[CDialogTitleStyle, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
			{...other}
		>
			{typeof children == "string" ? <span>{ttr(children)}</span> : children}
		</DialogTitle>
	);
}

export default CDialogTitle;
