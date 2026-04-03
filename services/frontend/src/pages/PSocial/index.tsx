import { useState } from "react";
import CTabs from "../../components/navigation/CTabs";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import PFriendAdd from "./PFriendAdd";
import PFriendList from "./PFriendList";
import PFriendReq from "./PFriendReq";
import type { IFriendInfo } from "../../types/friends";
import { Box, Slide } from "@mui/material";
import PFriendChat from "./PFriendChat";
function PSocial() {
	const [messaging, setMessaging] = useState<IFriendInfo | undefined>(undefined);

	return (
		<CTitlePaper
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			position="relative"
			sx={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				marginBottom: "20px",
				minHeight: 0,
				overflow: "hidden",
			}}
			title={messaging ? messaging.username : "FRIEND_TITLE"}
			data-testid="PSocial"
		>
			<Slide direction="right" in={messaging ? false : true}>
				<Box
					sx={{
						position: "absolute",
						padding: "inherit",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						flex: 1,
						overflow: "hidden",
					}}
				>
					<CTabs
						tabs={["FRIEND_LISTS", "FRIENDS_ADD", "FRIEND_REQUESTS"]}
						testid="PSocialTab"
					>
						<PFriendList
							onMessaging={(Friend: IFriendInfo) => {
								setMessaging(Friend);
							}}
						></PFriendList>
						<PFriendAdd></PFriendAdd>
						<PFriendReq></PFriendReq>
					</CTabs>
				</Box>
			</Slide>
			<Slide direction="left" in={messaging ? true : false}>
				<Box
					sx={{
						position: "absolute",
						padding: "inherit",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						flex: 1,
						overflow: "hidden",
					}}
				>
					<PFriendChat targetFriend={messaging}></PFriendChat>
				</Box>
			</Slide>
		</CTitlePaper>
	);
}

export default PSocial;
