import { Stack } from "@mui/material";
import CHomePaper from "../../components/surfaces/CHomePaper";
import CText from "../../components/text/CText";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButton from "../../components/inputs/buttons/CButton";

function PJoinRoom() {
	return (
		<CHomePaper sx={{ m: 0, height: "100%", width: "100%" }}>
			<Stack sx={{ alignItems: "stretch" }}>
				<CText size="lg">JOIN_ROOM</CText>
				<CTextField></CTextField>
				<CButton>JOIN</CButton>
			</Stack>
		</CHomePaper>
	);
}

export default PJoinRoom;
