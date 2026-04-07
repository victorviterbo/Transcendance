import { Stack } from "@mui/material";
import CTextField from "../../components/inputs/textFields/CTextField";
import type {
	IFriendFeed,
	IFriendInfo,
	IFriendMessage,
	IFriendMessageReq,
} from "../../types/friends";
import { API_SOCIAL_FRIENDS_MESSAGE_FEED } from "../../constants";
import api from "../../api";
import type { AxiosResponse } from "axios";
import { useEffect, useId, useState, type ReactNode } from "react";
import { getErrorNode } from "../../utils/error";
import type { GPageProps } from "../common/GPageBases";
import CText from "../../components/text/CText";
import PFriendChatNode from "./PFriendChatNode";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import SendIcon from "@mui/icons-material/Send";
import { appTexts } from "../../styles/theme";

interface PFriendChatProps extends GPageProps {
	targetFriend?: IFriendInfo;
}

function PFriendChat({ targetFriend }: PFriendChatProps) {
	const [feed, setFeed] = useState<IFriendFeed | undefined>(undefined);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const localID = useId();

	//WS
	// const wsContext: IWSContextModule = useWS("chat");
	// wsContext.onUpdate = () => {
	// 	while (wsContext.count > 0) console.log(wsContext.getLast());
	// };

	//LIST
	useEffect(() => {
		async function getChat(): Promise<void> {
			try {
				const res: AxiosResponse<IFriendFeed> = await api.post(
					API_SOCIAL_FRIENDS_MESSAGE_FEED,
					{
						username: targetFriend?.username,
						uid: targetFriend?.uid,
					} as IFriendMessageReq,
				);
				if (!res) throw {};
				if (res.data.error) throw res.data.error;
				if (typeof res.data != "object" || !res.data.feed) throw {};
				res.data.feed = res.data.feed.reverse();
				res.data.feed.forEach((message: IFriendMessage) => {
					if (typeof message.date == "string")
						message.date = new Date(message.date.toString());
				});
				setFeed(res.data);
				setError(undefined);
			} catch (error) {
				setError(getErrorNode(error, "SOCIAL_MESSAGE_ERROR"));
				setFeed(undefined);
			}
		}

		if (!targetFriend) setFeed(undefined);
		else getChat();
	}, [targetFriend]);

	function getList(): ReactNode | ReactNode[] {
		if (error) return error;
		if (!feed || feed.feed.length == 0 || !targetFriend)
			return <CText align="center">SOCIAL_NO_MESSAGE</CText>;
		return feed.feed.map((Message: IFriendMessage, index: number) => {
			return (
				<PFriendChatNode
					message={Message}
					targetFriend={targetFriend}
					key={localID + "_" + index}
				></PFriendChatNode>
			);
		});
	}

	return (
		<Stack sx={{ flex: 1, overflow: "hidden" }} direction="column">
			<Stack sx={{ flex: 1, overflow: "auto" }} direction="column-reverse">
				{getList()}
			</Stack>
			<Stack direction="row">
				<CTextField
					sx={{ flex: 1 }}
					fontWeight={500}
					fontFamily={appTexts.text.secondaryFamily}
					fontSize={appTexts.text.sizes.sm}
				></CTextField>
				<CIconButton sx={{ my: "auto", ml: "10px" }}>
					<SendIcon />
				</CIconButton>
			</Stack>
		</Stack>
	);
}

export default PFriendChat;
