import {  Grid, Stack } from "@mui/material";
import CHomePaper from "../../components/surfaces/CHomePaper";
import CText from "../../components/text/CText";
import type { IRoomInfo } from "../../types/room";
import CButtonRoom from "../../components/inputs/buttons/CButtonRoom";
import { useId } from "react";

function PPublicRooms() {

	function getRoomsTemps(): IRoomInfo[] {
		
		const tempRooms: IRoomInfo[] = []
		
		for(let i = 0; i < 155; i++)
		{
			tempRooms.push({
				name: "Test Name",
				theme: "Test theme",
				playerCount: 45,
				playerMax: 100
			})
		}
		return tempRooms;
	}
	const rooms: IRoomInfo[] = getRoomsTemps();
	const localID: string = useId();

	return <CHomePaper sx={{ m: 0,height: "100%", width: "100%"}}>
		<Stack sx={{ alignItems: "stretch"}}>
			<CText size="lg">PUBLIC_ROOM</CText>
			<Grid container spacing={3}>
				{
					rooms.map((item: IRoomInfo, index: number) => {
						return (
							<Grid size={1} key={localID + "-" + index}>
								<CButtonRoom infos={item} ></CButtonRoom>
							</Grid>
						)
					})
				}
			</Grid>
		</Stack>
	</CHomePaper>
}

export default PPublicRooms;