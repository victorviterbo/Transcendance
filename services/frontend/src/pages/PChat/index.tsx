import { Stack } from "@mui/material";
import CButton from "../../components/inputs/buttons/CButton";
import CTextField from "../../components/inputs/textFields/CTextField";
import GPageBase from "../common/GPageBases";

function PChat() {
	return (
		<GPageBase>
			<CTextField></CTextField>
			<CButton>Send</CButton>
			<Stack>
				
			</Stack>
		</GPageBase>
	);
}

export default PChat;
