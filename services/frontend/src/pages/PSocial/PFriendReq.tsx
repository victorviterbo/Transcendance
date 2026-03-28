import { Stack } from "@mui/material";
import type { IFriendRequests } from "../../types/friends";
import { API_SOCIAL_FRIENDS_REQUEST } from "../../constants";
import api from "../../api";
import type { AxiosResponse } from "axios";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { IExtUserInfo } from "../../types/user";
import { getErrorNode } from "../../utils/error";
import PFriendNode from "./PFriendNode";
import CText from "../../components/text/CText";
import CAccordionSimple from "../../components/feedback/accordion/CAccordionSimple";

function PFriendReq() {
	const [incoming, setIncoming] = useState<IExtUserInfo[]>([]);
	const [outgoing, setOutgoing] = useState<IExtUserInfo[]>([]);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const localId = useId();

	useEffect(() => {
		async function getFriends(): Promise<void> {
			try {
				const res: AxiosResponse<IFriendRequests> = await api.get(
					API_SOCIAL_FRIENDS_REQUEST,
				);
				if (!res) throw {};
				if (res.data.error) throw res.data.error;
				if (typeof res.data != "object" || !res.data.incoming || !res.data.outgoing)
					throw {};

				res.data.incoming.sort((friend1: IExtUserInfo, friend2: IExtUserInfo) => {
					if (friend1.username.toLocaleLowerCase() > friend2.username.toLocaleLowerCase())
						return 1;
					if (friend1.username.toLocaleLowerCase() < friend2.username.toLocaleLowerCase())
						return -1;
					return 0;
				});
				res.data.outgoing.sort((friend1: IExtUserInfo, friend2: IExtUserInfo) => {
					if (friend1.username.toLocaleLowerCase() > friend2.username.toLocaleLowerCase())
						return 1;
					if (friend1.username.toLocaleLowerCase() < friend2.username.toLocaleLowerCase())
						return -1;
					return 0;
				});
				setIncoming(res.data.incoming);
				setOutgoing(res.data.outgoing);
			} catch (error) {
				setError(getErrorNode(error, "SOCIAL_REQUESTS_ERROR"));
				setIncoming([]);
				setOutgoing([]);
			}
		}
		getFriends();
	}, [setIncoming, setOutgoing, setError]);

	function getIncoming(): ReactNode | ReactNode[] {
		if (error) return error;

		if (incoming.length == 0) return <CText align="center">SOCIAL_NO_INCOMING</CText>;
		return incoming.map((value: IExtUserInfo, index: number) => {
			return <PFriendNode type="user" user={value} key={localId + index}></PFriendNode>;
		});
	}

	function getOutgoing(): ReactNode | ReactNode[] {
		if (error) return error;

		if (outgoing.length == 0) return <CText align="center">SOCIAL_NO_OUTGOING</CText>;
		return outgoing.map((value: IExtUserInfo, index: number) => {
			return <PFriendNode type="user" user={value} key={localId + index}></PFriendNode>;
		});
	}

	return (
		<Stack sx={{ overflowY: "auto", flex: 1 }} data-testid="PFriendAdd">
			<CAccordionSimple
				title="SOCIAL_INCOMING_REQUESTS"
				fontSize="sm"
				sx={{ mb: "10px" }}
				defaultExpanded={true}
			>
				<Stack>{getIncoming()}</Stack>
			</CAccordionSimple>
			<CAccordionSimple title="SOCIAL_OUTGOING_REQUESTS" fontSize="sm" defaultExpanded={true}>
				<Stack>{getOutgoing()}</Stack>
			</CAccordionSimple>
		</Stack>
	);
}

export default PFriendReq;
