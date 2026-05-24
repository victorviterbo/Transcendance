import { Box, Stack } from "@mui/material";
import type { GPageProps } from "../../common/GPageBases";
import type { IGamePlayerAnswer } from "../../../types/game";
import CText from "../../../components/text/CText";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import { useMemo } from "react";
import {
	PGameRoundAnswerStyle,
	type IGameRoundAnswerStyle,
} from "../../../styles/pages/game/PGameRoundStyle";

interface PGameRoundAnswerProps extends GPageProps {
	answer: IGamePlayerAnswer;
	variant: "answer" | "time";
}

function PGameRoundAnswer({ answer, variant }: PGameRoundAnswerProps) {
	const style: IGameRoundAnswerStyle = useMemo(() => {
		return PGameRoundAnswerStyle(answer, variant);
	}, [answer, variant]);

	return (
		<Stack sx={style.main} direction={"row"}>
			<Box sx={style.iconBG}></Box>
			<CText size="sm" sx={style.message}>
				{answer.message}
			</CText>
			<CText size="2xs" sx={style.time}>
				{Math.round(answer.time * 100) / 100}
			</CText>
			<MicExternalOnIcon sx={style.artist} />
			<AudiotrackIcon sx={style.title} />
		</Stack>
	);
}

export default PGameRoundAnswer;
