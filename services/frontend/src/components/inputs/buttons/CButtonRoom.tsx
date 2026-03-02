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
		<CButton
			sx={{
				width: "7vw",
				height: "7vw",
				backgroundImage: "url(" + infos.img + ")",
				backgroundSize: "cover",
			}}
			{...other}
			data-testid={"CButtonRoom"}
		>
			<Stack>
				<CText
					size="md"
					color="black"
					sx={{ fontWeight: "900", WebkitTextStroke: "1px #ffffff" }}
				>
					{infos.name}
				</CText>
				<CText
					size="md"
					color="black"
					sx={{ fontWeight: "900", WebkitTextStroke: "1px #ffffff" }}
				>
					{infos.theme}
				</CText>
				<CText
					size="md"
					color="black"
					sx={{ fontWeight: "900", WebkitTextStroke: "1px #ffffff" }}
				>
					{infos.playerCount + " / " + infos.playerMax}
				</CText>
			</Stack>
		</CButton>
	);
}

export default CButtonRoom;
