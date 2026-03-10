import CHomePaper from "../../components/surfaces/CHomePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButton from "../../components/inputs/buttons/CButton";

function PJoinRoom() {
	return (
		<CHomePaper title="JOIN_ROOM" sx={{ m: 0, height: "100%", width: "100%" }}>
			<CTextField></CTextField>
			<CButton>JOIN</CButton>
		</CHomePaper>
	);
}

export default PJoinRoom;
