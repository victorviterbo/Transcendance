import { Stack } from "@mui/material";
import CHomePaper from "../../components/surfaces/CHomePaper";
import CText from "../../components/text/CText";
import type { IRoomInfo } from "../../types/room";
import CButtonRoom from "../../components/inputs/buttons/CButtonRoom";
import { useId } from "react";

function PFriendsRooms() {
	function getRoomsTemps(): IRoomInfo[] {
		const tempRooms: IRoomInfo[] = [];

		for (let i = 0; i < 10; i++) {
			tempRooms.push({
				name: "Test Name",
				theme: "Test theme",
				playerCount: 45,
				playerMax: 100,
			});
		}
		return tempRooms;
	}
	const rooms: IRoomInfo[] = getRoomsTemps();
	const localID: string = useId();

	return (
		<CHomePaper sx={{ m: 0, height: "100%", width: "100%" }}>
			<Stack sx={{ alignItems: "stretch" }}>
				<CText size="lg">FRIEND_ROOM</CText>
				<Stack spacing={3} direction={"row"}>
					{rooms.map((item: IRoomInfo, index: number) => {
						return <CButtonRoom infos={item} key={localID + "-" + index}></CButtonRoom>;
					})}
				</Stack>
			</Stack>
		</CHomePaper>
	);
}

export default PFriendsRooms;
