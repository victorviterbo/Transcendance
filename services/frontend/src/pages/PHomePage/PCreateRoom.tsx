import { Stack } from "@mui/material";
import CHomePaper from "../../components/surfaces/CHomePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CToggle from "../../components/inputs/toggle/CToggle";
import CButton from "../../components/inputs/buttons/CButton";

function PCreateRoom() {
	return (
		<CHomePaper title="CREATE_ROOM" sx={{ m: 0, height: "100%", width: "100%" }}>
			<CTextField></CTextField>
			<Stack
				direction={"row"}
				sx={{
					justifyContent: "space-between",
					alignItems: "stretch",
				}}
			>
				<CToggle
					options={[
						{ value: "private", label: "PRIVATE" },
						{ value: "public", label: "PUBLIC" },
					]}
				></CToggle>
				<CButton>PLAY_GAME</CButton>
			</Stack>
	</CHomePaper>
	);
}

export default PCreateRoom;
