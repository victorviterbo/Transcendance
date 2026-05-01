import { Box, Stack } from "@mui/material";
import CTextField from "../../components/inputs/textFields/CTextField";
import type { IExtUserInfo } from "../../types/user";
import { useId, useState, type ReactNode } from "react";
import CText from "../../components/text/CText";
import PFriendNode from "./PFriendNode";
import { getErrorNode } from "../../utils/error";
import { searchFriends } from "../../api/social";

function PFriendAdd() {
	const [users, setUsers] = useState<IExtUserInfo[]>([]);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const [search, setSearch] = useState<string>("");
	let lastTO: ReturnType<typeof setTimeout> | null = null;
	const localId = useId();

	const onSearch = async (value: string) => {
		if (value.length == 0) {
			setError(undefined);
			setUsers([]);
			setSearch("");
			return;
		}

		try {
			const res = await searchFriends(value);
			if (typeof res != "object" || !res.users)
				throw { error: { default: [{ message: "Invalid object", code: "INVALID" }] } };
			setUsers(
				res.users.filter((user: IExtUserInfo) => {
					return user.relation != "friends";
				}),
			);
			setSearch(value);
			setError(undefined);
		} catch (error) {
			setError(getErrorNode(error, "USERS_ADD_ERROR"));
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
		<Stack sx={{ overflow: "hidden", flex: 1 }} data-testid="PFriendAdd">
			<CTextField
				onChange={(e) => {
					if (lastTO) {
						clearTimeout(lastTO);
						lastTO = null;
					}
					lastTO = setTimeout(() => {
						onSearch(e.target.value);
					}, 300);
				}}
				data-testid="PSocialASearchAdd"
			></CTextField>
			<Box sx={{ mt: "20px", flex: 1, overflowY: "auto" }}>
				<Stack
					sx={{ mt: "20px", flex: 1, overflowY: "auto" }}
					data-testid="PFriendAdd_Stack"
				>
					{getUserList()}
				</Stack>
			</Box>
		</Stack>
	);
}

export default PFriendAdd;
