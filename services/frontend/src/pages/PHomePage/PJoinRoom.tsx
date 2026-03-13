import CHomePaper from "../../components/surfaces/CHomePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButtonText from "../../components/inputs/buttons/CButtonText";

function PJoinRoom() {
	return (
		<CHomePaper title="JOIN_ROOM" sx={{ m: 0, height: "100%", width: "100%" }}>
			<CTextField></CTextField>
			<CButtonText>JOIN</CButtonText>
		</CHomePaper>
	);
}

export default PJoinRoom;
