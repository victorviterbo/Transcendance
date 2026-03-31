import { Box, Collapse, Stack } from "@mui/material";
import type { GPageProps } from "../common/GPageBases";
import {
	type TFriendRelation,
	type IFriendInfo,
	type IFriendReqSend,
	type IFriendReqSendResponse,
} from "../../types/friends";
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
import { useState, type ReactNode } from "react";
import { getErrorNode } from "../../utils/error";
import type { AxiosResponse } from "axios";
import api from "../../api";
import { API_SOCIAL_FRIENDS_REQUEST_SEND } from "../../constants";

export interface PFriendNodeProps extends GPageProps {
	user: IFriendInfo | IExtUserInfo;
	type: "friend" | "user";
	hidden?: boolean;
}

function PFriendNode({ user, type, hidden }: PFriendNodeProps) {
	const [error, setError] = useState<ReactNode | undefined>();
	const [relation, setRelation] = useState<TFriendRelation>(
		type == "friend" ? "friends" : (user as IExtUserInfo).relation,
	);

	async function handleOnAdd() {
		try {
			if (type != "user") throw {};

			const res: AxiosResponse<IFriendReqSendResponse> = await api.post(
				API_SOCIAL_FRIENDS_REQUEST_SEND,
				{ "target-uid": user.uid, "target-username": user.username } as IFriendReqSend,
			);
			if (!res) throw {};
			if (res.data.error) throw res.data.error;
			setRelation("outgoing");
		} catch (error) {
			setError(getErrorNode(error, "SOCIAL_ADD_FRIEND_FAILED", { size: "sm" }));
		}
	}

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
						{!error ? (
							<>
								<CTitle sx={PFriendNodeNameStyle} size="sm">
									{user.username}
								</CTitle>
								<CText sx={PFriendNodeBadgeStyle} size="sm">
									{user.badges}
								</CText>
							</>
						) : (
							error
						)}
					</Stack>
					<Stack direction="row" sx={{ alignItems: "center" }}>
						{relation === "friends" && (
							<CIconButton
								sx={PFriendNodeMessageStyle}
								data-testid="PFriendNode_MessageButton"
							>
								<MessageIcon />
							</CIconButton>
						)}
						{relation === "not-friends" && (
							<CIconButton
								sx={PFriendNodeMessageStyle}
								data-testid="PFriendNode_AddButton"
								onClick={handleOnAdd}
							>
								<PersonAddIcon />
							</CIconButton>
						)}
						{relation === "outgoing" && (
							<CText size="sm" sx={{ my: "auto" }} testid="PFriendNode_Sent">
								SOCIAL_REQUESTS_OUTGOING
							</CText>
						)}
						{relation === "incoming" && (
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
									data-testid="PFriendNode_CancelButton"
								></CCancelButton>
							</Stack>
						)}
					</Stack>
				</Stack>
			</Box>
		</Collapse>
	);
}

export default PFriendNode;
