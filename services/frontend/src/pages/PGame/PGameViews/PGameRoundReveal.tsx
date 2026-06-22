import { Stack } from "@mui/material";
import type { IGameTrack } from "../../../types/game";
import type { GPageProps } from "../../common/GPageBases";
import CTitle from "../../../components/text/CTitle";
import CText from "../../../components/text/CText";
import CCover from "../../../components/images/CCover";
import {
	PGameRoundRevealStyle,
	type IGameRoundRevealStyle,
} from "../../../styles/pages/game/PGameRoundStyle";
import { useMemo } from "react";

interface PGameRoundRevealProps extends GPageProps {
	title: IGameTrack;
}

function PGameRoundReveal({ title }: PGameRoundRevealProps) {
	const style: IGameRoundRevealStyle = useMemo(() => {
		return PGameRoundRevealStyle();
	}, []);

	return (
		<Stack sx={style.main} direction={"row"}>
			<CCover grey={true} url={title.artwork} alt={title.artist + "-" + title.title}></CCover>
			<Stack direction={"column"} sx={{ ml: "15px", alignItems: "flex-start" }}>
				<CTitle noTr={true} size="sm" sx={{ m: 0 }}>
					{title.title}
				</CTitle>
				<CText noTr={true} size="sm" sx={{ m: 0 }}>
					{title.artist}
				</CText>
			</Stack>
		</Stack>
	);
}

export default PGameRoundReveal;
