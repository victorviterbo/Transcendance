import { Stack } from "@mui/material";
import CHomePaper from "../../components/surfaces/CHomePaper";
import CText from "../../components/text/CText";
import CTextField from "../../components/inputs/textFields/CTextField";
import CToggle from "../../components/inputs/toggle/CToggle";
import CButton from "../../components/inputs/buttons/CButton";

function PCreateRoom() {
	return (
		<CHomePaper sx={{ m: 0, height: "100%", width: "100%" }}>
			<Stack sx={{ alignItems: "stretch" }}>
				<CText size="lg">CREATE_ROOM</CText>
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
			</Stack>
		</CHomePaper>
	);
}

export default PCreateRoom;
