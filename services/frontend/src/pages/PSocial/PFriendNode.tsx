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
import type { IExtUserInfo } from "../../types/user";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CValidButton from "../../components/inputs/buttons/CValidButton";
import CCancelButton from "../../components/inputs/buttons/CCancelButton";

export interface PFriendNodeProps extends GPageProps {
	user: IFriendInfo | IExtUserInfo;
	type: "friend" | "user";
	hidden?: boolean;
}

function PFriendNode({ user, type, hidden }: PFriendNodeProps) {
	return (
		<Collapse in={!hidden} data-testid="PFriendNode">
			<Box
				sx={(theme) => PFriendNodeStyle(theme, { hidden, type, user })}
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
					{(type == "friend" || (user as IExtUserInfo).relation == "friends") && (
						<CIconButton
							sx={PFriendNodeMessageStyle}
							data-testid="PFriendNode_MessageButton"
						>
							<MessageIcon />
						</CIconButton>
					)}
					{type == "user" && (user as IExtUserInfo).relation == "not-friends" && (
						<CIconButton
							sx={PFriendNodeMessageStyle}
							data-testid="PFriendNode_AddButton"
						>
							<PersonAddIcon />
						</CIconButton>
					)}
					{type == "user" && (user as IExtUserInfo).relation == "outgoing" && (
						<CText size="sm" sx={{ my: "auto" }}>
							SOCIAL_REQUESTS_OUTGOING
						</CText>
					)}
					{type == "user" && (user as IExtUserInfo).relation == "incoming" && (
						<Stack direction={"row"}>
							<CValidButton
								sx={PFriendNodeMessageStyle}
								data-testid="PFriendNode_ValidButton"
							></CValidButton>
							<CCancelButton
								sx={[
									{ ml: "5px" },
									...(Array.isArray(PFriendNodeMessageStyle)
										? PFriendNodeMessageStyle
										: PFriendNodeMessageStyle
											? [PFriendNodeMessageStyle]
											: []),
								]}
								data-testid="PFriendNode_CencelButton"
							></CCancelButton>
						</Stack>
					)}
				</Stack>
			</Box>
		</Collapse>
	);
}

export default PFriendNode;
