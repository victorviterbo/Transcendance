import RefreshIcon from "@mui/icons-material/Refresh";
import { Box, Grid, Stack } from "@mui/material";
import { type IGameListEntry } from "../../types/game";
import CButtonRoom from "../../components/inputs/buttons/CButtonRoom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GPageProps } from "../common/GPageBases";
import { fetchFriendsGames, fetchPublicGames } from "../../api/game";
import CText from "../../components/text/CText";
import { getErrorMessage } from "../../utils/error";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import CTitleBasePaper from "../../components/surfaces/CTitleBasePaper";
import { CTitlePaperTitleStyle } from "../../styles/components/surfaces/CTitlePaper";

type RoomListStatus = "loading" | "ready" | "error";

interface RoomListState {
	status: RoomListStatus;
	roomList: IGameListEntry[];
	error: string | null;
}

interface PRoomListProps extends GPageProps {
	isPublic: boolean;
}

function PRoomList({ isPublic }: PRoomListProps) {
	const [roomListState, setRoomListState] = useState<RoomListState>({
		status: "loading",
		roomList: [],
		error: null,
	});
	const [refreshDisabled, setRefreshDisabled] = useState(false);
	const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const status: RoomListStatus = roomListState.status;
	const roomList = roomListState.roomList;
	const error = roomListState.error;

	const fetchRoomList = useCallback(() => {
		const fetchGames = isPublic ? fetchPublicGames : fetchFriendsGames;
		return fetchGames();
	}, [isPublic]);

	useEffect(() => {
		let ignore = false;

		void fetchRoomList()
			.then((data) => {
				if (ignore) return;
				setRoomListState({
					status: "ready",
					roomList: data.rooms,
					error: null,
				});
			})
			.catch((error) => {
				if (ignore) return;
				setRoomListState({
					status: "error",
					roomList: [],
					error: getErrorMessage(error, "ROOMS_LOADING_FAILED"),
				});
			});

		return () => {
			ignore = true;
		};
	}, [fetchRoomList]);

	useEffect(() => {
		return () => {
			if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
		};
	}, []);

	const handleRefresh = () => {
		if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
		setRefreshDisabled(true);
		setRoomListState((current) => ({
			...current,
			status: "loading",
			error: null,
		}));
		void fetchRoomList()
			.then((data) => {
				setRoomListState({
					status: "ready",
					roomList: data.rooms,
					error: null,
				});
			})
			.catch((error) => {
				setRoomListState({
					status: "error",
					roomList: [],
					error: getErrorMessage(error, "ROOMS_LOADING_FAILED"),
				});
			})
			.finally(() => {
				refreshTimerRef.current = setTimeout(() => {
					setRefreshDisabled(false);
					refreshTimerRef.current = null;
				}, 1500);
			});
	};

	return (
		<CTitleBasePaper
			titleNode={
				<Box sx={{ position: "relative" }}>
					<CText sx={CTitlePaperTitleStyle} size="lg" textAlign="center">
						{isPublic ? "PUBLIC_ROOM" : "FRIEND_ROOM"}
					</CText>
					<CIconButton
						onClick={handleRefresh}
						disabled={status === "loading" || refreshDisabled}
						sx={{
							position: "absolute",
							right: 15,
							top: 0,
							width: 30,
							height: 30,
						}}
					>
						<RefreshIcon fontSize="small" />
					</CIconButton>
				</Box>
			}
			data-testid={isPublic ? "public_room_testid" : "private_room_testid"}
		>
			{status === "loading" ? <CText size="sm">ROOMS_LOADING</CText> : null}

			{status === "error" ? (
				<CText size="sm" color="error.main">
					{error ?? "ROOMS_LOADING_FAILED"}
				</CText>
			) : null}

			{status === "ready" && roomList.length === 0 ? (
				<CText size="sm">ROOMS_EMPTY</CText>
			) : null}

			{status === "ready" && roomList.length > 0 ? (
				<Stack>
					<Grid container spacing={3}>
						{roomList.map((item: IGameListEntry) => (
							<Grid size={1} key={item.uid}>
								<CButtonRoom infos={item}></CButtonRoom>
							</Grid>
						))}
					</Grid>
				</Stack>
			) : null}
		</CTitleBasePaper>
	);
}

export default PRoomList;
