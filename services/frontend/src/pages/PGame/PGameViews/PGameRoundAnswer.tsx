import { Box, Stack } from "@mui/material";
import type { GPageProps } from "../../common/GPageBases";
import type { IGamePlayerAnswer, IGameSettings } from "../../../types/game";
import CText from "../../../components/text/CText";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import { memo, useMemo } from "react";
import {
	PGameRoundAnswerStyle,
	type IGameRoundAnswerStyle,
} from "../../../styles/pages/game/PGameRoundStyle";
import { ttrf } from "../../../localization/localization";

interface PGameRoundAnswerProps extends GPageProps {
	answer: IGamePlayerAnswer;
	variant: "answer" | "time";
	settings?: IGameSettings;
}

function PGameRoundAnswer({ answer, settings, variant }: PGameRoundAnswerProps) {
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
				{answer.time < 0 || (settings && answer.time >= settings.playbackDuration)
					? "--"
					: ttrf("SECONDS", { COUNT: Math.round(answer.time * 100) / 100 + "" })}
			</CText>
			<MicExternalOnIcon sx={style.artist} />
			<AudiotrackIcon sx={style.title} />
		</Stack>
	);
}

export default memo(PGameRoundAnswer);
