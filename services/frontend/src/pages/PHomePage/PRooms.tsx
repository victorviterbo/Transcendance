import { Box, Grid, Stack } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import { type IRoomList, type IRoomInfo } from "../../types/room";
import CButtonRoom from "../../components/inputs/buttons/CButtonRoom";
import { useEffect, useId, useState } from "react";
import type { GPageProps } from "../common/GPageBases";
import api from "../../api";
import { API_PRIVATE_ROOMS, API_PUBLIC_ROOMS } from "../../constants";
import type { AxiosResponse } from "axios";
import CText from "../../components/text/CText";

interface PRoomsProps extends GPageProps {
	isPublic: boolean;
}

function PRooms({ isPublic }: PRoomsProps) {
	const [rooms, setRooms] = useState<IRoomInfo[]>([]);
	const localID: string = useId();

	useEffect(() => {
		async function getRoomsTemps(): Promise<void> {
			try {
				const res: AxiosResponse<IRoomList> = await api.get<IRoomList>(
					isPublic ? API_PUBLIC_ROOMS : API_PRIVATE_ROOMS,
				);
				setRooms(res.data.rooms);
			} catch (error) {
				console.log("Failed to load rooms: ", error);
				setRooms([]);
			}
		}
		getRoomsTemps();
	}, [setRooms, isPublic]);

	return (
		<CTitlePaper
			title={isPublic ? "PUBLIC_ROOM" : "FRIEND_ROOM"}
			sx={{ m: 0, height: "100%", width: "100%" }}
			data-testid={isPublic ? "public_room_testid" : "private_room_testid"}
		>
			<Stack spacing={2.5}>
				<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.82)", lineHeight: 1.5 }}>
					{isPublic
						? "Open lobbies ready for instant chaos. Pick one with a strong crowd and jump in."
						: "Private rooms created by you and your friends, styled like cards instead of placeholders."}
				</CText>
				{rooms.length === 0 ? (
					<Box
						sx={{
							px: 3,
							py: 5,
							borderRadius: "26px",
							border: "2px dashed rgba(255, 255, 255, 0.5)",
							backgroundColor: "rgba(23, 15, 56, 0.16)",
							textAlign: "center",
						}}
					>
						<CText size="md">No rooms are live yet. Create one and set the pace.</CText>
					</Box>
				) : (
					<Grid container spacing={2.5}>
						{rooms.map((item: IRoomInfo, index: number) => {
							return (
								<Grid
									size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}
									key={localID + "-" + item.name + "-" + index}
								>
									<CButtonRoom infos={item}></CButtonRoom>
								</Grid>
							);
						})}
					</Grid>
				)}
			</Stack>
		</CTitlePaper>
	);
}

export default PRooms;
