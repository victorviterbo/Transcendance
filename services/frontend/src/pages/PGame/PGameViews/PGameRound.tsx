import { Box, Grid, Stack } from "@mui/material";
import CText from "../../../components/text/CText";
import CTextField from "../../../components/inputs/textFields/CTextField";
import SendIcon from "@mui/icons-material/Send";
import CIconButton from "../../../components/inputs/buttons/CIconButton";
import { appColors, appTexts } from "../../../styles/theme";
import { ttrfn } from "../../../localization/localization";
import type { GPageProps } from "../../common/GPageBases";
import type {
	IGamePlayer,
	IGamePlayerAnswer,
	IGamePlayerResult,
	IGameRound,
	IGameSettings,
	IGameStatus,
} from "../../../types/game";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import PGameRoundStateNode from "./PGameRoundStateNode";
import PGameRoundTracker from "./PGameRoundTracker";
import PGameRoundAnswer from "./PGameRoundAnswer";
import { PGameRoundStyle, type IGameRoundStyle } from "../../../styles/pages/game/PGameRoundStyle";
import PGameRoundReveal from "./PGameRoundReveal";
import CVolumeSilder from "../../../components/inputs/slider/CVolumeSilder";
import type { GameInstance } from "../../../handlers/gameHandlers";
import CCountdownCircular from "../../../components/feedback/loading/CCountdownCircular";
import { GAME_MAX_ROUND_DISPLAYED, GAME_ROUND_PASSED_DISPLAYED } from "../../../constants";

interface PGameRoundProps extends GPageProps {
	players: IGamePlayer[];
	game:  React.RefObject<GameInstance | undefined>;
	status: IGameStatus;
	settings: IGameSettings;
	rounds: IGameRound[];
	results: IGamePlayerResult[],
	volume: number
	muted: boolean
	answerRef: React.RefObject<HTMLDivElement | null>
}

function PGameRound({ game, status, rounds, results, settings, volume, muted, answerRef}: PGameRoundProps) {

	//====================== STATES ======================
	const [answerField, setAnswerField] = useState<string>("");

	//====================== MAPS ======================	
	const roundHistory = useMemo((): ReactNode[] => {
		const displayed: IGameRound[] = rounds.filter((_, index: number) => {
			const start = Math.min(
				Math.max(0, status.round - GAME_ROUND_PASSED_DISPLAYED), 
				Math.max(0, settings.trackCount - GAME_MAX_ROUND_DISPLAYED)
			)
			const end = Math.min(
				start + GAME_MAX_ROUND_DISPLAYED -1,
				settings.trackCount - 1
			)

			return start <= index && index <= end;
		})
		return displayed.map((round: IGameRound, index: number) => {
			return (
				<PGameRoundStateNode
					key={"round-node-" + index}
					round={round}
				></PGameRoundStateNode>
			);
		});
	}, [rounds, status, settings]);

	const answerHistory = useMemo((): ReactNode[] => {
		return rounds[status.round].answers.map((answer: IGamePlayerAnswer, index: number) => {
			if(!answer.validated)
				return;
			return (
				<Grid size={6} key={"answer-node-" + index}>
					<PGameRoundAnswer variant="answer" answer={answer} />
				</Grid>
			);
		});
	}, [rounds, status]);

	const playerTimes = useMemo((): ReactNode[] => {
		
		return results.map((result: IGamePlayerResult) => {
			if(!result.artistFound && !result.titleFound)
				return;
			return (
				<PGameRoundAnswer
					variant="time"
					key={result.user.uid}
					answer={{
						validated: true,
						message: result.user.username,
						time: result.time,
						titleFound: result.titleFound,
						artistFound: result.artistFound,
					}}
					settings={settings}
				></PGameRoundAnswer>
			);
		});
	}, [results, settings]);

	const isLocked = useMemo(() => {
		if(status.phase != "playing_round")
			return true;
		return rounds[status.round].artistFound && rounds[status.round].titleFound;
	}, [status, rounds])

	//====================== EVENTS ======================
	const handleSendMessage = useCallback(() => {
		if(!game.current || answerField == "" || /^\s+$/g.test(answerField))
			return;
		game.current.submitAnswer(answerField);
		setAnswerField("");
	}, [game, answerField, setAnswerField])

	useEffect(() => {
		async function clear()
		{
			if(status.phase == "playing_break")
				setAnswerField("");
		}
		clear();
	}, [status, setAnswerField])

	//====================== STYLE ======================
	const style: IGameRoundStyle = useMemo(() => {
		return PGameRoundStyle();
	}, []);

	//====================== STRUCTURE ======================
	return (
		<Stack
			direction={"column"}
			sx={{ position: "absolute", inset: "15px"}}
		>
			<Box sx={style.progressBox}>
				<Stack direction={"column"}>
					<Stack direction={"row"} sx={{ alignItems: "center" }}>
						<CText sx={{ m: 0, mr: "15px", textAlign: "center" }}>
							{ttrfn("GAME_ROUND_INDICATOR", {
								CURRENT: <span>{status.round + 1}</span>,
								MAX: <span>{settings.trackCount}</span>,
							})}
						</CText>
						<Stack direction={"row"} sx={{ flexWrap: "wrap" }}>
							{roundHistory}
						</Stack>
					</Stack>
					<PGameRoundTracker
						settings={settings}
						status={status}
						round={rounds[status.round]}
					/>
				</Stack>
			</Box>
			<Stack direction={"row"} sx={{ flex: 1, overflow: "hidden" }}>
				<Stack
					sx={{ flex: 0.7, my: "10px", p: "5px", overflowX: "hidden", overflowY: "auto" }}
					direction={"column"}
				>
					<Box>
						{rounds[status.round].track.title && <PGameRoundReveal title={rounds[status.round].track}></PGameRoundReveal>}
					</Box>
					<Grid container spacing={"5px"}>
						{answerHistory}
					</Grid>
				</Stack>
				<Stack direction={"column"} sx={{ flex: 0.3, overflow: "hidden" }}>
					<Stack direction={"row"} sx={style.pointBox}>
						<Stack direction={"column"} sx={style.pointBoxTextList}>
							<CText>GAME_ROUND_ARTIST</CText>
							<CText>GAME_ROUND_TITLE</CText>
							<CText>GAME_ROUND_SPEED</CText>
						</Stack>
						<Stack direction={"column"} sx={style.pointBoxPointList}>
							<CText sx={{  color:  rounds[status.round].artistFound ? appColors.primary[0] : appColors.cancel[0] }}>{rounds[status.round].artistFound ? 5 : 0}</CText>
							<CText sx={{ color: rounds[status.round].titleFound ? appColors.primary[0] : appColors.cancel[0] }}>{rounds[status.round].titleFound ? 5 : 0}</CText>
							<CText sx={{ color: appColors.secondary[0] }}>{rounds[status.round].bonusPoints == undefined ? "-" : rounds[status.round].bonusPoints?.toString()}</CText>
						</Stack>
						<Stack direction={"column"} sx={style.pointBoxPointSumup}>
							<CText size="lg">{rounds[status.round].points}</CText>
							<CText size="xs">GAME_ROUND_POINTS</CText>
						</Stack>
					</Stack>
					<Stack
						direction={"column"}
						sx={{ flex: 1, mr: "10px", my: "10px", overflow: "auto" }}
					>
						{playerTimes}
					</Stack>
				</Stack>
			</Stack>
			<Stack direction={"row"} sx={{ alignItems: "flex-start" }}>
				<CTextField
					ref={answerRef}
					sx={{ flex: 1, m: 0 }}
					fontWeight={500}
					fontFamily={appTexts.text.secondaryFamily}
					fontSize={appTexts.text.sizes.xs}
					borderWidth="2px"
					verticalPadding="10px"
					value={answerField}
					onChange={(event) => {
						setAnswerField(event.target.value);
					}}
					onKeyUp={(event) => {
						if (event.code == "Enter") handleSendMessage();
					}}
					data-testid="PGameChat-TextField"
					disabled={isLocked}
				></CTextField>
				<CIconButton
					onClick={handleSendMessage}
					sx={{ ml: "5px", mr: "20px" }}
					data-testid="PGameChat-SendButton"
					disabled={isLocked}
				>
					<SendIcon fontSize="small" />
				</CIconButton>
				<CCountdownCircular startTime={status.keyTime} timeMS={(status.phase == "playing_break" ? settings.breakDuration : settings.playbackDuration) * 1000} size={"35px"} fontSize="xs" startColor={appColors.primary[0]} endColor={appColors.cancel[0]}>
				</CCountdownCircular>
				<CVolumeSilder volume={volume} muted={muted} onVolumeChanged={(value) => {
					if(game.current)
						game.current.changeVolume(value);
				}}
				onVolumeMuted={(value) => {
					if(game.current)
						game.current.mute(value);
				}}></CVolumeSilder>
			</Stack>
		</Stack>
	);
}

export default PGameRound;
