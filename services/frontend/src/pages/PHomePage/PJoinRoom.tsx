import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButtonText from "../../components/inputs/buttons/CButtonText";

function PJoinRoom() {
	return (
		<CTitlePaper title="JOIN_ROOM" sx={{ m: 0, height: "100%", width: "100%" }}>
			<CTextField></CTextField>
			<CButtonText>JOIN</CButtonText>
		</CTitlePaper>
	);
}

export default PJoinRoom;
