import { Stack } from "@mui/material";
import type { GPageProps } from "../../common/GPageBases";
import type { IGameRound, IGameSettings } from "../../../types/game";
import CText from "../../../components/text/CText";
import { memo, useMemo } from "react";
import { PGameEndedRoundStyle, type IGameEndedRoundStyle } from "../../../styles/pages/game/PGameRoundStyle";
import CCover from "../../../components/images/CCover";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import StarIcon from '@mui/icons-material/Star';
import { ttrf } from "../../../localization/localization";


interface PGameEndedRoundProps extends GPageProps {
	round: IGameRound;
	settings: IGameSettings;
}

function PGameEndedRound({round, settings}: PGameEndedRoundProps) {

	const style: IGameEndedRoundStyle = useMemo(() => {
		return PGameEndedRoundStyle(round, settings);
	}, [round, settings]);

	return <Stack sx={style.main} direction={"row"}>
		<Stack direction={"row"} sx={{my: "5px", flex: 1}}>
			<CCover url={round.track.artwork} alt={round.track.artist + " - " + round.track.title}/>
			<Stack direction={"column"} >
				<CText>{round.track.title}</CText>
				<CText>{round.track.artist}</CText>
			</Stack>
		</Stack>
		<Stack direction={"row"} sx={style.dataStack}>
			<StarIcon sx={{color: style.rankingColor, ml: "15px"}}/>
			<CText size="xs" sx={style.rankingText}>{round.points}</CText>
			<LeaderboardIcon sx={{color: style.rankingColor}}/>
			<CText size="xs" sx={style.rankingText}>{round.ranking}</CText>
			<AccessTimeIcon sx={{color: style.timeColor}}/>
			<CText size="xs" sx={style.timeText}>{round.time < 0 || (settings && round.time >= settings.playbackDuration)
								? "--"
								: ttrf("SECONDS", { COUNT: Math.round(round.time * 100) / 100 + "" })}</CText>
			<MicExternalOnIcon sx={style.artist}/>
			<AudiotrackIcon sx={style.title}/>
		</Stack>
	</Stack>
}

export default memo(PGameEndedRound);