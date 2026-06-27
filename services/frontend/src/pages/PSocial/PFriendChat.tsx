import { Stack } from "@mui/material";
import CTextField from "../../components/inputs/textFields/CTextField";
import type { IFriendFeed, IFriendInfo, IFriendMessage } from "../../types/socials";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getErrorNode } from "../../utils/error";
import type { GPageProps } from "../common/GPageBases";
import CText from "../../components/text/CText";
import PFriendChatNode from "./PFriendChatNode";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import SendIcon from "@mui/icons-material/Send";
import { appTexts } from "../../styles/theme";
import type { IWSContextModule, IWSGameSendEvent, TWSRcv, TWSSend } from "../../types/websocket";
import { useWS } from "../../components/websocket/CWebsocket";
import { fetchFriendMessages } from "../../api/social";

interface PFriendChatProps extends GPageProps {
	targetFriend?: IFriendInfo;
}

function PFriendChat({ targetFriend }: PFriendChatProps) {
	const [feed, setFeed] = useState<IFriendFeed | undefined>(undefined);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const [messageField, setMessageField] = useState<string>("");
	const wsContext: IWSContextModule = useWS("friend-chat");
	const lastTarget = useRef<IFriendInfo | undefined>(undefined);

	//====================== INCOMINGS ======================
	useEffect(() => {
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | IWSGameSendEvent | undefined = wsContext.getLast();
				if (last?.target == "friend-chat") {
					if (last.event == "update_status") {
						if (!feed || !last.message) return;
						const index = feed.feed.findIndex((message: IFriendMessage) => {
							return message.uid == last.message.uid;
						});
						if (index == -1) return;
						feed.feed[index].status = last.message.status;
						setFeed(structuredClone(feed));
					}
					if (last.event == "new") {
						if (
							!feed ||
							!last.message ||
							last.message["target-id"] != targetFriend?.uid
						)
							return;
						feed.feed.splice(0, 0, last.message);
						setFeed(structuredClone(feed));
					}
				}
			}
		});
	}, [wsContext, feed, targetFriend]);

	useEffect(() => {
		async function getChat(): Promise<void> {
			try {
				if (!targetFriend) return;
				const res: IFriendFeed = await fetchFriendMessages(targetFriend);
				if (typeof res != "object" || !res.feed) throw {};
				res.feed = res.feed.reverse();
				res.feed.forEach((message: IFriendMessage) => {
					if (typeof message.date == "string")
						message.date = new Date(message.date.toString());
				});
				setFeed(res);
				setError(undefined);

				wsContext.sendMessage(
					JSON.stringify({
						target: "friend-chat",
						event: "open",
						to: targetFriend.username,
						toUid: targetFriend.uid,
					} as TWSSend),
				);
				lastTarget.current = targetFriend;
			} catch (error) {
				setError(getErrorNode(error, "SOCIAL_MESSAGE_ERROR"));
				setFeed(undefined);
			}
		}

		if (!targetFriend) {
			setFeed(undefined);
			if (lastTarget.current) {
				wsContext.sendMessage(
					JSON.stringify({
						target: "friend-chat",
						event: "close",
						to: lastTarget.current.username,
						toUid: lastTarget.current.uid,
					} as TWSSend),
				);
			}
		} else getChat();
	}, [targetFriend, wsContext]);

	//====================== OUTGOING ======================
	const handleSendMessage = useCallback(() => {
		if (!messageField || messageField.length == 0) return;
		if (!targetFriend) return;

		const nMessage: IFriendMessage = {
			message: messageField,
			date: new Date(),
			status: "not-sent",
			"target-id": targetFriend.uid,
			target: targetFriend.username,
			direction: "outgoing",
			uid: "TEMP_ID",
		};

		wsContext.sendMessage(
			JSON.stringify({
				target: "friend-chat",
				event: "send",
				message: nMessage,
			} as TWSSend),
		);

		setMessageField("");
	}, [wsContext, setMessageField, messageField, targetFriend]);

	//====================== FUNCTIONS ======================
	const messageList: ReactNode | ReactNode[] = useMemo(() => {
		if (error) return error;
		if (!feed || feed.feed.length == 0 || !targetFriend)
			return <CText align="center">SOCIAL_NO_MESSAGE</CText>;
		return feed.feed.map((Message: IFriendMessage) => {
			return (
				<PFriendChatNode
					message={Message}
					targetFriend={targetFriend}
					key={Message.uid}
				></PFriendChatNode>
			);
		});
	}, [feed, error, targetFriend]);

	return (
		<Stack sx={{ flex: 1, overflow: "hidden" }} direction="column">
			<Stack sx={{ flex: 1, overflow: "auto" }} direction="column-reverse">
				{messageList}
			</Stack>
			<Stack direction="row">
				<CTextField
					sx={{ flex: 1 }}
					fontWeight={500}
					fontFamily={appTexts.text.secondaryFamily}
					fontSize={appTexts.text.sizes.sm}
					value={messageField}
					onChange={(event) => {
						setMessageField(event.target.value);
					}}
					onKeyUp={(event) => {
						if (event.code == "Enter") handleSendMessage();
					}}
					data-testid="PFriendChat_NewMessage"
				></CTextField>
				<CIconButton
					onClick={handleSendMessage}
					sx={{ my: "auto", ml: "10px" }}
					data-testid="PFriendChat_SendButton"
				>
					<SendIcon />
				</CIconButton>
			</Stack>
		</Stack>
	);
}

export default PFriendChat;
