import { Box, Collapse, Stack, useMediaQuery, useTheme } from "@mui/material";
import type { GPageProps } from "../common/GPageBases";
import { type TFriendRelation, type IFriendInfo } from "../../types/socials";
import CAvatar from "../../components/images/CAvatar";
import CUserProfileLink from "../../components/navigation/CUserProfileLink";
import CTitle from "../../components/text/CTitle";
import {
	PFriendNodeStyle,
	type IFriendNodeStyle,
} from "../../styles/pages/social/PFriendNodeStyle";
import CText from "../../components/text/CText";
import MessageIcon from "@mui/icons-material/Message";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import type { IExtUserInfo } from "../../types/user";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CValidButton from "../../components/inputs/buttons/CValidButton";
import CCancelButton from "../../components/inputs/buttons/CCancelButton";
import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { getErrorNode } from "../../utils/error";
import { respondFriendRequest, sendFriendRequest } from "../../api/social";

export interface PFriendNodeProps extends GPageProps {
	user: IFriendInfo | IExtUserInfo;
	type: "friend" | "user";
	hidden?: boolean;

	onStateChanged?: () => void;
	onMessaging?: (Friend: IFriendInfo) => void;
}

function PFriendNode({ user, type, hidden, onStateChanged, onMessaging }: PFriendNodeProps) {
	const [error, setError] = useState<ReactNode | undefined>();
	const [relation, setRelation] = useState<TFriendRelation>(
		type == "friend" ? "friends" : (user as IExtUserInfo).relation,
	);

	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
	const isTiny = useMediaQuery(theme.breakpoints.down("tn"));

	const handleOnAdd = useCallback(async () => {
		try {
			if (type != "user") throw {};

			await sendFriendRequest(user);
			setRelation("outgoing");
		} catch (errorIn) {
			setError(getErrorNode(errorIn, "SOCIAL_ADD_FRIEND_FAILED", { size: "sm" }));
		}
	}, [setError, setRelation, type, user]);

	const handleOnAction = useCallback(
		async (Action: "accept" | "refuse") => {
			try {
				if (type != "user") throw {};

				await respondFriendRequest(user, Action);
				if (onStateChanged) onStateChanged();
				setError(undefined);
			} catch (errorIn) {
				setError(getErrorNode(errorIn, "SOCIAL_RESPOND_FRIEND_FAILED", { size: "sm" }));
			}
		},
		[setError, onStateChanged, user, type],
	);

	const style: IFriendNodeStyle = useMemo(() => {
		return PFriendNodeStyle(theme, { hidden, type, user });
	}, [theme, hidden, type, user]);

	return (
		<Collapse in={!hidden} data-testid="PFriendNode">
			<Box sx={style.main} data-testid="PFriendNodeBox">
				<Stack direction="row">
					<CAvatar
						profileUsername={user.username}
						sx={style.avatar}
						src={user.image}
						alt={user.username + "'s picture"}
					></CAvatar>
					<Stack sx={style.text}>
						{!error ? (
							<>
								<CUserProfileLink username={user.username}>
									<CTitle
										noTr={true}
										sx={style.name}
										size={isTiny ? "2xs" : "xs"}
									>
										{user.username}
									</CTitle>
								</CUserProfileLink>
								<CText sx={style.badge} size={isTiny ? "2xs" : "xs"}>
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
								sx={style.message}
								data-testid="PFriendNode_MessageButton"
								onClick={() => {
									if (onMessaging && type == "friend" && "created_at" in user)
										onMessaging(user);
								}}
							>
								<MessageIcon fontSize={isSmall ? "small" : "medium"} />
							</CIconButton>
						)}
						{relation === "not-friends" && (
							<CIconButton
								sx={style.message}
								data-testid="PFriendNode_AddButton"
								onClick={handleOnAdd}
							>
								<PersonAddIcon fontSize={isSmall ? "small" : "medium"} />
							</CIconButton>
						)}
						{relation === "outgoing" && (
							<CText
								size={isSmall ? "xs" : "sm"}
								sx={{ my: "auto" }}
								testid="PFriendNode_Sent"
							>
								SOCIAL_REQUESTS_OUTGOING
							</CText>
						)}
						{relation === "incoming" && (
							<Stack direction={"row"}>
								<CValidButton
									sx={style.message}
									onClick={() => {
										handleOnAction("accept");
									}}
									data-testid="PFriendNode_ValidButton"
									fontSize={isSmall ? "small" : "medium"}
								></CValidButton>
								<CCancelButton
									onClick={() => {
										handleOnAction("refuse");
									}}
									sx={[
										{ ml: "5px" },
										...(Array.isArray(style.message)
											? style.message
											: style.message
												? [style.message]
												: []),
									]}
									fontSize={isSmall ? "small" : "medium"}
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

export default memo(PFriendNode);
