import { Avatar, type AvatarProps } from "@mui/material";
import type { GCompProps } from "../common/GProps";

interface CAvatarProps extends GCompProps, AvatarProps {}

function CAvatar({ ...other }: CAvatarProps) {
	return <Avatar {...other}></Avatar>;
}

export default CAvatar;
