import { Grid, Stack } from "@mui/material";
import CHomePaper from "../../components/surfaces/CHomePaper";
import CText from "../../components/text/CText";
import { type IRoomList, type IRoomInfo } from "../../types/room";
import CButtonRoom from "../../components/inputs/buttons/CButtonRoom";
import { useEffect, useId, useState } from "react";
import type { GPageProps } from "../common/GPageBases";
import api from "../../api";
import { API_PRIVATE_ROOMS, API_PUBLIC_ROOMS } from "../../constants";
import type { AxiosResponse } from "axios";

interface PRoomsProps extends GPageProps {
	isPublic: boolean;
}

function PRooms({ isPublic }: PRoomsProps) {
	const [rooms, setRooms] = useState<IRoomInfo[]>([]);
	const localID: string = useId();

	useEffect(() => {
		async function getRoomsTemps(): Promise<void> {
			try {
				const res: AxiosResponse<IRoomList> = await api.get<IRoomList>(isPublic ? API_PUBLIC_ROOMS : API_PRIVATE_ROOMS);
				console.log(res.status);
				console.log(res.data);
				setRooms(res.data.rooms);
			} catch (error) {
				console.log("Failed to load rooms: ", error);
				setRooms([]);
			}
		}
		getRoomsTemps();
	}, [setRooms, isPublic])

	return (
		<CHomePaper sx={{ m: 0, height: "100%", width: "100%" }}>
			<Stack sx={{ alignItems: "stretch" }}>
				<CText size="lg">{isPublic ? "PUBLIC_ROOM" : "FRIEND_ROOM"}</CText>
				<Grid container spacing={3}>
					{rooms.map((item: IRoomInfo, index: number) => {
						return (
							<Grid size={1} key={localID + "-" + index}>
								<CButtonRoom infos={item}></CButtonRoom>
							</Grid>
						);
					})}
				</Grid>
			</Stack>
		</CHomePaper>
	);
}

export default PRooms;
