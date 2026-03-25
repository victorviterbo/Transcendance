import { Box, Collapse, Stack } from "@mui/material";
import type { GPageProps } from "../common/GPageBases";
import type { IFriendInfo } from "../../types/friends";
import CAvatar from "../../components/images/CAvatar";
import CTitle from "../../components/text/CTitle";
import {
	PFriendNodeAvatarStyle,
	PFriendNodeBadgeStyle,
	PFriendNodeMessageStyle,
	PFriendNodeNameStyle,
	PFriendNodeStyle,
	PFriendNodeTextsStyle,
} from "../../styles/pages/social/PFriendNodeStyle";
import CText from "../../components/text/CText";
import MessageIcon from "@mui/icons-material/Message";
import CIconButton from "../../components/inputs/buttons/CIconButton";

export interface PFriendNodeProps extends GPageProps {
	user: IFriendInfo;
	hidden?: boolean;
}

function PFriendNode({ user, hidden }: PFriendNodeProps) {
	return (
		<Collapse in={!hidden} data-testid="PFriendNode">
			<Box
				sx={(theme) => PFriendNodeStyle(theme, { hidden, user })}
				data-testid="PFriendNodeBox"
			>
				<Stack direction="row">
					<CAvatar
						sx={PFriendNodeAvatarStyle}
						src={user.image}
						alt={user.username + "'s picture"}
					></CAvatar>
					<Stack sx={PFriendNodeTextsStyle}>
						<CTitle sx={PFriendNodeNameStyle} size="sm">
							{user.username}
						</CTitle>
						<CText sx={PFriendNodeBadgeStyle} size="sm">
							{user.badges}
						</CText>
					</Stack>
					<CIconButton sx={PFriendNodeMessageStyle}>
						<MessageIcon />
					</CIconButton>
				</Stack>
			</Box>
		</Collapse>
	);
}

export default PFriendNode;
