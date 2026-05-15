import { Stack } from "@mui/material";
import type { IGameListEntry } from "../../../types/game";
import type { CButtonProps } from "./CButton";
import CButton from "./CButton";
import CText from "../../text/CText";
import { ttr } from "../../../localization/localization";

interface CButtonRoomProps extends CButtonProps {
	infos: IGameListEntry;
}

function CButtonRoom({ infos, ...other }: CButtonRoomProps) {
	const genres =
		infos.genres.length > 0
			? infos.genres.map((genre) => ttr(genre)).join(", ")
			: ttr("ROOM_GENRES_EMPTY");

	return (
		<CButton
			sx={{
				width: "7vw",
				height: "7vw",
			}}
			{...other}
			data-testid={"CButtonRoom"}
		>
			<Stack>
				<CText
					noTr={true}
					size="md"
					color="black"
					sx={{ fontWeight: "900", WebkitTextStroke: "1px #ffffff" }}
				>
					{infos.name}
				</CText>
				<CText
					noTr={true}
					size="md"
					color="black"
					sx={{ fontWeight: "900", WebkitTextStroke: "1px #ffffff" }}
				>
					{genres}
				</CText>
				<CText
					noTr={true}
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
