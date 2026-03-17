import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import { Stack } from "@mui/material";

function PJoinRoom() {
	return (
		<CTitlePaper title="JOIN_ROOM" sx={{ m: 0, height: "100%", width: "100%" }}>
			<CTextField sx={{ m: 0, mb: 2, width: "100%" }}></CTextField>
			<Stack direction="row">
				<CButtonText sx={{ ml: "auto", height: appPositions.sizes.buttons.home }}>
					JOIN
				</CButtonText>
			</Stack>
		</CTitlePaper>
	);
}

export default PJoinRoom;
