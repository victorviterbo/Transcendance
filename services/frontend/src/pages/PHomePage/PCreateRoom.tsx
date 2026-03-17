import { Stack } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CToggle from "../../components/inputs/toggle/CToggle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";

function PCreateRoom() {
	return (
		<CTitlePaper title="CREATE_ROOM" sx={{ m: 0, height: "100%", width: "100%" }}>
			<CTextField sx={{ m: 0, mb: 2, width: "100%" }}></CTextField>
			<Stack
				direction={"row"}
				sx={{
					justifyContent: "space-between",
					alignItems: "stretch",
				}}
			>
				<CToggle
					sx={{ height: appPositions.sizes.buttons.home }}
					options={[
						{ value: "private", label: "PRIVATE" },
						{ value: "public", label: "PUBLIC" },
					]}
				></CToggle>
				<CButtonText>PLAY_GAME</CButtonText>
			</Stack>
		</CTitlePaper>
	);
}

export default PCreateRoom;
