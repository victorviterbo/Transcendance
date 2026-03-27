import { Box, Stack } from "@mui/material";
import CTextField from "../../components/inputs/textFields/CTextField";
import { API_SOCIAL_FRIENDS_SEARCH } from "../../constants";
import api from "../../api";
import type { IExtUserInfo, IExtUserList } from "../../types/user";
import type { AxiosResponse } from "axios";
import { useId, useState, type ReactNode } from "react";
import CText from "../../components/text/CText";
import PFriendNode from "./PFriendNode";
import { getErrorNode } from "../../utils/error";

function PFriendAdd() {
	const [users, setUsers] = useState<IExtUserInfo[]>([]);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const [search, setSearch] = useState<string>("");
	const localId = useId();

	const onSearch = async (value: string) => {
		if (value.length == 0) {
			setError(undefined);
			setUsers([]);
			setSearch("");
			return;
		}

		try {
			const res: AxiosResponse<IExtUserList> = await api.post(API_SOCIAL_FRIENDS_SEARCH, {
				search: value,
			});
			if (!res)
				throw { error: { default: [{ message: "No response", code: "NO_RESPONSE" }] } };
			if (res.data.error) throw res.data.error;
			if (typeof res.data != "object" || !res.data.users)
				throw { error: { default: [{ message: "Invalid object", code: "INVALID" }] } };
			setUsers(res.data.users);
			setSearch(value);
		} catch (error) {
			setError(getErrorNode(error, "FRIEND_ERROR"));
			setUsers([]);
		}
	};

	function getUserList(): ReactNode | ReactNode[] {
		if (error) return error;

		if (search.length == 0) return null;
		if (users.length == 0) return <CText align="center">USERS_NOTFOUND</CText>;
		return users.map((value: IExtUserInfo, index: number) => {
			return <PFriendNode type="user" user={value} key={localId + index}></PFriendNode>;
		});
	}

	return (
		<Stack sx={{ overflow: "hidden", flex: 1 }}>
			<CTextField
				onChange={(e) => {
					onSearch(e.target.value);
				}}
				data-testid="PSocialASearchAdd"
			></CTextField>
			<Box sx={{ mt: "20px", flex: 1, overflowY: "auto" }}>
				<Stack sx={{ mt: "20px", flex: 1, overflowY: "auto" }}>{getUserList()}</Stack>
			</Box>
		</Stack>
	);
}

export default PFriendAdd;
