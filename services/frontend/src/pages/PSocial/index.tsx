import { Box, Stack } from "@mui/material";
import CTabs from "../../components/navigation/CTabs";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import PFriendNode from "./PFriendNode";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { AxiosResponse } from "axios";
import type { IFriendInfo, IFriendsList, TFriendStatus } from "../../types/friends";
import api from "../../api";
import { API_SOCIAL_FRIENDS } from "../../constants";
import CText from "../../components/text/CText";
import { getErrorNode } from "../../utils/error";

function PSocial() {
	const [friends, setFriends] = useState<IFriendInfo[]>([]);
	const [friendsFilter, setFriendsFilter] = useState<string>("");
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const localId = useId();

	useEffect(() => {
		async function getFriends(): Promise<void> {
			try {
				const res: AxiosResponse<IFriendsList> = await api.get(API_SOCIAL_FRIENDS);
				if(res.data.error)
					throw res.data.error;
				if (typeof res.data != "object" || !res.data.friends) {
					console.error("Failed to load friends: 'Unknown'");
					setFriends([]);
					return;
				}
				const allstatus: TFriendStatus[] = ["online", "busy", "offline"];
				res.data.friends.sort((friend1: IFriendInfo, friend2: IFriendInfo) => {
					if (
						allstatus.findIndex((status: TFriendStatus) => friend1.status == status) >
						allstatus.findIndex((status: TFriendStatus) => friend2.status == status)
					)
						return 1;
					if (
						allstatus.findIndex((status: TFriendStatus) => friend1.status == status) <
						allstatus.findIndex((status: TFriendStatus) => friend2.status == status)
					)
						return -1;

					if (friend1.username.toLocaleLowerCase() > friend2.username.toLocaleLowerCase())
						return 1;
					if (friend1.username.toLocaleLowerCase() < friend2.username.toLocaleLowerCase())
						return -1;
					return 0;
				});
				setFriends(res.data.friends);
			} catch (error) {
				console.error("Failed to load friends: ", error);
				setError(getErrorNode(error, "FRIEND_ERROR"));
				setFriends([]);
			}
		}
		getFriends();
	}, [setFriends, setError]);

	function getFriendsList(): ReactNode | ReactNode[] {
		if (error) return error;

		if (friends.length == 0) return <CText align="center">FRIEND_EMPTY</CText>;
		return friends.map((value: IFriendInfo, index: number) => {
			return (
				<PFriendNode
					user={value}
					key={localId + index}
					hidden={
						friendsFilter != "" &&
						!value.username
							.toLocaleLowerCase()
							.includes(friendsFilter.toLocaleLowerCase())
					}
				></PFriendNode>
			);
		});
	}

	return (
		<CTitlePaper
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			sx={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				marginBottom: "20px",
				overflow: "hidden",
			}}
			title={"FRIEND_TITLE"}
		>
			<CTabs tabs={["FRIEND_LISTS", "FRIEND_REQUESTS"]}>
				<Stack sx={{ overflow: "hidden", flex: 1 }}>
					<CTextField
						onChange={(e) => {
							setFriendsFilter(e.target.value);
						}}
					></CTextField>
					<Box sx={{ mt: "20px", flex: 1, overflowY: "auto" }}>
						<Stack sx={{ mt: "20px", flex: 1, overflowY: "auto" }}>
							{getFriendsList()}
						</Stack>
					</Box>
				</Stack>
			</CTabs>
		</CTitlePaper>
	);
}

export default PSocial;
