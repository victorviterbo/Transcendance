import { Stack } from "@mui/material";
import type { IRoomInfo } from "../../../types/room";
import type { CButtonProps } from "./CButton";
import CButton from "./CButton";
import CText from "../../text/CText";

interface CButtonRoomProps extends CButtonProps {
	infos: IRoomInfo;
}

function CButtonRoom({ infos, ...other }: CButtonRoomProps) {


	return (
		<CButton sx={{ width: "7vw", height: "7vw"}} {...other}>
			<Stack>
				<CText size="md">{infos.name}</CText>
				<CText size="md">{infos.theme}</CText>
				<CText size="md">{infos.playerCount + " / " + infos.playerMax}</CText>
			</Stack>
		</CButton>
	);
}

export default CButtonRoom;
