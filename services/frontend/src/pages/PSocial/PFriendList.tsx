import { Box, Stack } from "@mui/material";
import CTextField from "../../components/inputs/textFields/CTextField";
import PFriendNode from "./PFriendNode";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { AxiosResponse } from "axios";
import type { IFriendInfo, IFriendsList, TFriendStatus } from "../../types/friends";
import api from "../../api";
import { API_SOCIAL_FRIENDS } from "../../constants";
import CText from "../../components/text/CText";
import { getErrorNode } from "../../utils/error";
import type { GPageProps } from "../common/GPageBases";

interface PFriendListProps extends GPageProps {
	onMessaging: (Friend: IFriendInfo) => void;
}

function PFriendList({ onMessaging }: PFriendListProps) {
	const [friends, setFriends] = useState<IFriendInfo[]>([]);
	const [friendsFilter, setFriendsFilter] = useState<string>("");
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const localId = useId();

	// const wsContext: IWSContextModule = useWS("list");
	// wsContext.onUpdate = () => {
	// 	while (wsContext.count > 0) console.log(wsContext.getLast());
	// };

	useEffect(() => {
		async function getFriends(): Promise<void> {
			try {
				const res: AxiosResponse<IFriendsList> = await api.get(API_SOCIAL_FRIENDS);
				if (!res) throw {};
				if (res.data.error) throw res.data.error;
				if (typeof res.data != "object" || !res.data.friends) throw {};

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
				setError(undefined);
			} catch (error) {
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
					type="friend"
					hidden={
						friendsFilter != "" &&
						!value.username
							.toLocaleLowerCase()
							.includes(friendsFilter.toLocaleLowerCase())
					}
					onMessaging={onMessaging}
				></PFriendNode>
			);
		});
	}

	return (
		<Stack sx={{ overflow: "hidden", flex: 1 }} data-testid="PFriendList">
			<CTextField
				onChange={(e) => {
					setFriendsFilter(e.target.value);
				}}
				data-testid="PSocialSearchList"
			></CTextField>
			<Box sx={{ mt: "20px", flex: 1, overflowY: "auto" }}>
				<Stack sx={{ mt: "20px", flex: 1, overflowY: "auto" }}>{getFriendsList()}</Stack>
			</Box>
		</Stack>
	);
}

export default PFriendList;
