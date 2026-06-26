import { Box, Stack } from "@mui/material";
import CTextField from "../../components/inputs/textFields/CTextField";
import PFriendNode from "./PFriendNode";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { IFriendInfo, TFriendStatus } from "../../types/socials";
import CText from "../../components/text/CText";
import { getErrorNode } from "../../utils/error";
import type { GPageProps } from "../common/GPageBases";
import { fetchFriends } from "../../api/social";

interface PFriendListProps extends GPageProps {
	onMessaging: (Friend: IFriendInfo) => void;
	open: boolean;
}

function PFriendList({ open, onMessaging }: PFriendListProps) {
	const [friends, setFriends] = useState<IFriendInfo[]>([]);
	const [friendsFilter, setFriendsFilter] = useState<string>("");
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const localId = useId();

	useEffect(() => {
		if (!open) return;

		async function getFriends(): Promise<void> {
			try {
				const res = await fetchFriends();
				if (typeof res != "object" || !res.friends) throw {};

				const allstatus: TFriendStatus[] = ["online", "busy", "offline"];
				res.friends.sort((friend1: IFriendInfo, friend2: IFriendInfo) => {
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
				setFriends(res.friends);
				setError(undefined);
			} catch (error) {
				setError(getErrorNode(error, "FRIEND_ERROR"));
				setFriends([]);
			}
		}
		getFriends();
	}, [setFriends, setError, open]);

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
