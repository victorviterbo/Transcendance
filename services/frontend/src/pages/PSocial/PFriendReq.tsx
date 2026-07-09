import { Stack, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { IExtUserInfo } from "../../types/user";
import { getErrorNode } from "../../utils/error";
import PFriendNode from "./PFriendNode";
import CText from "../../components/text/CText";
import CAccordionSimple from "../../components/feedback/accordion/CAccordionSimple";
import { useWS } from "../../components/websocket/CWebsocket";
import type { IWSContextModule, IWSGameSendEvent, TWSRcv } from "../../types/websocket";
import { fetchFriendRequests } from "../../api/social";
import type { GPageProps } from "../common/GPageBases";

interface PFriendReqProps extends GPageProps {
	open: boolean;
}

function PFriendReq({ open }: PFriendReqProps) {
	const [incoming, setIncoming] = useState<IExtUserInfo[]>([]);
	const [outgoing, setOutgoing] = useState<IExtUserInfo[]>([]);
	const [error, setError] = useState<ReactNode | undefined>(undefined);
	const wsContext: IWSContextModule = useWS("friend_request");

	const theme = useTheme();
	const isTiny = useMediaQuery(theme.breakpoints.down("tn"));

	//====================== GETTERS ======================
	const getUsers = useCallback(async () => {
		try {
			const res = await fetchFriendRequests();
			if (typeof res != "object" || !res.incoming || !res.outgoing) throw {};

			res.incoming.sort((friend1: IExtUserInfo, friend2: IExtUserInfo) => {
				if (friend1.username.toLocaleLowerCase() > friend2.username.toLocaleLowerCase())
					return 1;
				if (friend1.username.toLocaleLowerCase() < friend2.username.toLocaleLowerCase())
					return -1;
				return 0;
			});
			res.outgoing.sort((friend1: IExtUserInfo, friend2: IExtUserInfo) => {
				if (friend1.username.toLocaleLowerCase() > friend2.username.toLocaleLowerCase())
					return 1;
				if (friend1.username.toLocaleLowerCase() < friend2.username.toLocaleLowerCase())
					return -1;
				return 0;
			});
			setIncoming(res.incoming);
			setOutgoing(res.outgoing);
			setError(undefined);
		} catch (errorIn) {
			setError(getErrorNode(errorIn, "SOCIAL_REQUESTS_ERROR"));
			setIncoming([]);
			setOutgoing([]);
		}
	}, [setIncoming, setOutgoing, setError]);

	const incomingNodes: ReactNode | ReactNode[] = useMemo(() => {
		if (error) return error;

		if (incoming.length == 0) return <CText align="center">SOCIAL_NO_INCOMING</CText>;
		return incoming.map((value: IExtUserInfo) => {
			return (
				<PFriendNode
					type="user"
					user={value}
					key={value.uid}
					onStateChanged={() => {
						getUsers();
					}}
				></PFriendNode>
			);
		});
	}, [incoming, error, getUsers]);

	const outgoingNodes: ReactNode | ReactNode[] = useMemo(() => {
		if (error) return error;

		if (outgoing.length == 0) return <CText align="center">SOCIAL_NO_OUTGOING</CText>;
		return outgoing.map((value: IExtUserInfo) => {
			return <PFriendNode type="user" user={value} key={value.uid}></PFriendNode>;
		});
	}, [outgoing, error]);

	//====================== EVENTS / UPDATES ======================
	const onFriendRequest = useCallback(
		(user: IExtUserInfo) => {
			//Checking if present in sent
			const found: number = outgoing.findIndex(
				(userCheck: IExtUserInfo) => userCheck.uid == user.uid,
			);
			if (found >= 0) {
				outgoing.splice(found, 1);
				setOutgoing(structuredClone(outgoing));
			}

			const foundIncoming: number = incoming.findIndex(
				(userCheck: IExtUserInfo) => userCheck.uid == user.uid,
			);
			if (foundIncoming >= 0) return;

			incoming.splice(0, 0, user);
			setIncoming(structuredClone(incoming));
		},
		[incoming, setIncoming, outgoing, setOutgoing],
	);

	useEffect(() => {
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | IWSGameSendEvent | undefined = wsContext.getLast();
				if (last?.target == "friend_request") {
					if (last.event == "new_incoming") {
						onFriendRequest(last.user);
					}
				}
			}
		});
	}, [wsContext, incoming, setIncoming, onFriendRequest]);

	useEffect(() => {
		if (!open) return;
		getUsers();
	}, [getUsers, open]);

	return (
		<Stack sx={{ overflowY: "auto", flex: 1 }} data-testid="PFriendReq">
			<CAccordionSimple
				title="SOCIAL_INCOMING_REQUESTS"
				fontSize="sm"
				sx={{ mb: "10px" }}
				defaultExpanded={true}
				detailsSX={isTiny ? { p: 0, mt: "10px" } : undefined}
			>
				<Stack data-testid="PFriendReq_incoming">{incomingNodes}</Stack>
			</CAccordionSimple>
			<CAccordionSimple
				title="SOCIAL_OUTGOING_REQUESTS"
				fontSize="sm"
				detailsSX={isTiny ? { p: 0, mt: "10px" } : undefined}
				defaultExpanded={true}
			>
				<Stack data-testid="PFriendReq_outgoing">{outgoingNodes}</Stack>
			</CAccordionSimple>
		</Stack>
	);
}

export default PFriendReq;
