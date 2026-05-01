import { Avatar, type AvatarProps } from "@mui/material";
import type { GCompProps } from "../common/GProps";
import CUserProfileLink from "../navigation/CUserProfileLink";

interface CAvatarProps extends GCompProps, AvatarProps {
	profileUsername?: string;
	profileAriaLabel?: string;
}

function CAvatar({ profileUsername, profileAriaLabel, ...other }: CAvatarProps) {
	const avatar = <Avatar {...other}></Avatar>;

	if (!profileUsername) return avatar;

	return (
		<CUserProfileLink
			username={profileUsername}
			aria-label={profileAriaLabel ?? `Open profile ${profileUsername}`}
			sx={{ borderRadius: "999px", flexShrink: 0 }}
		>
			{avatar}
		</CUserProfileLink>
	);
}

export default CAvatar;
