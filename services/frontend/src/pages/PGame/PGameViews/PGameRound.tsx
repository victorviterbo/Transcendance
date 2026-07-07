import { Box, Grid, Stack, useMediaQuery, useTheme } from "@mui/material";
import CText from "../../../components/text/CText";
import CTextField from "../../../components/inputs/textFields/CTextField";
import SendIcon from "@mui/icons-material/Send";
import CIconButton from "../../../components/inputs/buttons/CIconButton";
import { appColors, appTexts } from "../../../styles/theme";
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
import {
	GAME_MAX_ROUND_DISPLAYED,
	GAME_MAX_ROUND_DISPLAYED_SMALL,
	GAME_ROUND_PASSED_DISPLAYED,
	GAME_ROUND_PASSED_DISPLAYED_SMALL,
} from "../../../constants";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import { useLang } from "../../../components/contexts/CLanguageProvider";
import { isKeyboardSubmit } from "../../../utils/keyboard";

interface PGameRoundProps extends GPageProps {
	players: IGamePlayer[];
	game: React.RefObject<GameInstance | undefined>;
	status: IGameStatus;
	settings: IGameSettings;
	rounds: IGameRound[];
	results: IGamePlayerResult[];
	volume: number;
	muted: boolean;
	answerRef: React.RefObject<HTMLDivElement | null>;
}

function PGameRound({
	game,
	status,
	rounds,
	results,
	settings,
	volume,
	muted,
	answerRef,
}: PGameRoundProps) {
	//====================== STATES ======================
	const [answerField, setAnswerField] = useState<string>("");
	const { ttrf, ttrfn } = useLang();

	//====================== EVENTS ======================
	const handleSendMessage = useCallback(() => {
		if (!game.current || answerField == "" || /^\s+$/g.test(answerField)) return;
		game.current.submitAnswer(answerField);
		setAnswerField("");
	}, [game, answerField, setAnswerField]);

	useEffect(() => {
		async function clear() {
			if (status.phase == "playing_break") setAnswerField("");
		}
		clear();
	}, [status, setAnswerField]);

	//====================== STYLE ======================
	const style: IGameRoundStyle = useMemo(() => {
		return PGameRoundStyle();
	}, []);
	const theme = useTheme();
	const isMedium = useMediaQuery(theme.breakpoints.down("md"));
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
	const isLarge = useMediaQuery(theme.breakpoints.down("lg"));

	//====================== COMPOENTS ======================
	const pointBox = useMemo(() => {
		const titleFound: boolean = rounds[status.round].titleFound;
		const titleFoundAt: number | undefined = rounds[status.round].titleFoundAt;
		const artistFound: boolean = rounds[status.round].artistFound;
		const artistFoundAt: number | undefined = rounds[status.round].artistFoundAt;

		return (
			<Stack direction={"row"} sx={style.pointBox}>
				<Stack direction={"column"} sx={style.pointBoxTextList}>
					<MicExternalOnIcon />
					<AudiotrackIcon />
					<LeaderboardIcon />
				</Stack>
				<Stack direction={"column"} sx={style.pointBoxPointList}>
					<CText
						size={isLarge ? "sm" : "md"}
						sx={{
							color: artistFound
								? appColors.primary[0]
								: status.phase == "playing_round"
									? appColors.secondary[0]
									: appColors.cancel[0],
						}}
					>
						{artistFound && artistFoundAt != undefined
							? ttrf("SECONDS", { COUNT: Math.round(artistFoundAt * 100) / 100 + "" })
							: status.phase == "playing_round"
								? "--"
								: "0"}
					</CText>
					<CText
						size={isLarge ? "sm" : "md"}
						sx={{
							color: titleFound
								? appColors.primary[0]
								: status.phase == "playing_round"
									? appColors.secondary[0]
									: appColors.cancel[0],
						}}
					>
						{titleFound && titleFoundAt != undefined
							? ttrf("SECONDS", { COUNT: Math.round(titleFoundAt * 100) / 100 + "" })
							: status.phase == "playing_round"
								? "--"
								: "0"}
					</CText>
					<CText
						size={isLarge ? "sm" : "md"}
						sx={{
							color:
								rounds[status.round].ranking == 0
									? appColors.greys[4]
									: rounds[status.round].ranking <= 3
										? appColors.secondary[0]
										: appColors.primary[0],
						}}
					>
						{rounds[status.round].ranking == 0
							? "--"
							: rounds[status.round].ranking.toString()}
					</CText>
				</Stack>
				<Stack direction={"column"} sx={style.pointBoxPointSumup}>
					<CText size={isMedium ? "md" : "lg"}>{rounds[status.round].points}</CText>
					<CText size={isMedium ? "2xs" : "xs"}>GAME_ROUND_POINTS</CText>
				</Stack>
			</Stack>
		);
	}, [rounds, status, style, isLarge, isMedium, ttrf]);

	//====================== MAPS ======================
	const roundHistory = useMemo((): ReactNode[] => {
		const displayed: IGameRound[] = rounds.filter((_, index: number) => {
			const start = Math.min(
				Math.max(
					0,
					status.round -
						(isMedium
							? GAME_ROUND_PASSED_DISPLAYED_SMALL
							: GAME_ROUND_PASSED_DISPLAYED),
				),
				Math.max(
					0,
					settings.trackCount -
						(isMedium ? GAME_MAX_ROUND_DISPLAYED_SMALL : GAME_MAX_ROUND_DISPLAYED),
				),
			);
			const end = Math.min(
				start + (isMedium ? GAME_MAX_ROUND_DISPLAYED_SMALL : GAME_MAX_ROUND_DISPLAYED) - 1,
				settings.trackCount - 1,
			);

			return start <= index && index <= end;
		});
		return displayed.map((round: IGameRound, index: number) => {
			return (
				<PGameRoundStateNode
					key={"round-node-" + index}
					round={round}
				></PGameRoundStateNode>
			);
		});
	}, [rounds, status, settings, isMedium]);

	const answerHistory = useMemo((): ReactNode[] => {
		return rounds[status.round].answers.map((answer: IGamePlayerAnswer, index: number) => {
			if (!answer.validated) return;
			return (
				<Grid size={{ xs: 12, sm: 6 }} key={"answer-node-" + index}>
					<PGameRoundAnswer variant="answer" answer={answer} />
				</Grid>
			);
		});
	}, [rounds, status]);

	const playerTimes = useMemo((): ReactNode[] => {
		return results.map((result: IGamePlayerResult) => {
			if (!result.artistFound && !result.titleFound) return;
			if (isMedium) {
				return (
					<Grid size={6} key={result.player.uid}>
						<PGameRoundAnswer
							variant="time"
							answer={{
								validated: true,
								message: result.player.username,
								time: result.time,
								titleFound: result.titleFound,
								artistFound: result.artistFound,
							}}
							settings={settings}
						/>
					</Grid>
				);
			}
			return (
				<PGameRoundAnswer
					variant="time"
					key={result.player.uid}
					answer={{
						validated: true,
						message: result.player.username,
						time: result.time,
						titleFound: result.titleFound,
						artistFound: result.artistFound,
					}}
					settings={settings}
				></PGameRoundAnswer>
			);
		});
	}, [results, settings, isMedium]);

	const isLocked = useMemo(() => {
		if (status.phase != "playing_round") return true;
		return rounds[status.round].artistFound && rounds[status.round].titleFound;
	}, [status, rounds]);

	//====================== FINAL ======================
	const gameInfo = useMemo(() => {
		return (
			<Stack direction="row" sx={{ flex: 1, overflow: "hidden" }}>
				<Stack
					sx={{ flex: 0.7, my: "10px", p: "5px", overflowX: "hidden", overflowY: "auto" }}
					direction={"column"}
				>
					<Box>
						{rounds[status.round].track.title && (
							<PGameRoundReveal title={rounds[status.round].track}></PGameRoundReveal>
						)}
					</Box>
					<Grid container spacing={"5px"}>
						{answerHistory}
					</Grid>
				</Stack>
				<Stack direction={"column"} sx={{ flex: 0.3, overflow: "hidden" }}>
					{pointBox}
					<Stack
						direction={"column"}
						sx={{ flex: 1, mr: "10px", my: "10px", overflow: "auto" }}
					>
						{playerTimes}
					</Stack>
				</Stack>
			</Stack>
		);
	}, [rounds, answerHistory, playerTimes, pointBox, status]);

	const gameInfoMedium = useMemo(() => {
		return (
			<Stack direction="column" sx={{ flex: 1, overflow: "hidden" }}>
				<Stack direction={"row"} sx={{ mt: "7px" }}>
					<Stack direction="column" sx={{ flex: 0.75, position: "relative" }}>
						{rounds[status.round].track.title && (
							<PGameRoundReveal title={rounds[status.round].track}></PGameRoundReveal>
						)}
						{!rounds[status.round].track.title && (
							<Grid
								container
								sx={{
									overflowY: "auto",
									position: "absolute",
									inset: 0,
									mr: "10px",
									alignContent: "flex-start",
								}}
								spacing={"5px"}
							>
								{playerTimes}
							</Grid>
						)}
					</Stack>
					{pointBox}
				</Stack>
				<Grid overflow={"auto"} container sx={{ mt: "10px" }} spacing={"5px"}>
					{status.phase == "playing_round" && answerHistory}
					{status.phase == "playing_break" && playerTimes}
				</Grid>
			</Stack>
		);
	}, [rounds, answerHistory, pointBox, status, playerTimes]);

	const gameInfoSmall = useMemo(() => {
		return (
			<Stack direction="column" sx={{ flex: 1, overflow: "hidden" }}>
				<Stack direction={"column"} sx={{ mt: "7px" }}>
					{pointBox}
					<Stack direction="column" sx={{ flex: 0.75, position: "relative" }}>
						{rounds[status.round].track.title && (
							<PGameRoundReveal title={rounds[status.round].track}></PGameRoundReveal>
						)}
					</Stack>
				</Stack>
				<Grid overflow={"auto"} container sx={{ mt: "10px" }} spacing={"5px"}>
					{status.phase == "playing_round" && answerHistory}
					{status.phase == "playing_break" && playerTimes}
				</Grid>
			</Stack>
		);
	}, [rounds, answerHistory, pointBox, status, playerTimes]);

	//====================== STRUCTURE ======================
	return (
		<Stack direction={"column"} sx={{ position: "absolute", inset: "15px" }}>
			<Box sx={style.progressBox}>
				<Stack direction={"column"}>
					<Stack direction={"row"} sx={{ alignItems: "center" }}>
						<CText
							size={isSmall ? "sm" : undefined}
							sx={{ m: 0, mr: "15px", textAlign: "center" }}
						>
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
			{!isMedium && !isSmall && gameInfo}
			{isMedium && !isSmall && gameInfoMedium}
			{isMedium && isSmall && gameInfoSmall}
			<Stack
				direction={{ xs: "column", md: "row" }}
				sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
			>
				<Stack direction={"row"} sx={{ flex: 1, alignItems: "flex-start" }}>
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
							if (isKeyboardSubmit(event)) handleSendMessage();
						}}
						data-testid="PGameChat-TextField"
						disabled={isLocked}
					></CTextField>
					<CIconButton
						onClick={handleSendMessage}
						sx={{ ml: "5px", mr: { xs: "0px", md: "20px" } }}
						data-testid="PGameChat-SendButton"
						disabled={isLocked}
					>
						<SendIcon fontSize="small" />
					</CIconButton>
				</Stack>
				<Stack
					direction={"row"}
					sx={{
						alignItems: "flex-start",
						mt: { xs: "20px", md: "0px" },
						justifyContent: "space-between",
					}}
				>
					{isMedium && (
						<CVolumeSilder
							volume={volume}
							muted={muted}
							sx={{ flex: 1, mr: "50px" }}
							onVolumeChanged={(value) => {
								if (game.current) game.current.changeVolume(value);
							}}
							onVolumeMuted={(value) => {
								if (game.current) game.current.mute(value);
							}}
						></CVolumeSilder>
					)}
					<CCountdownCircular
						startTime={status.keyTime}
						timeMS={
							(status.phase == "playing_break"
								? settings.breakDuration
								: settings.playbackDuration) * 1000
						}
						size={"35px"}
						fontSize="xs"
						startColor={appColors.primary[0]}
						endColor={appColors.cancel[0]}
					></CCountdownCircular>
					{!isMedium && (
						<CVolumeSilder
							volume={volume}
							muted={muted}
							onVolumeChanged={(value) => {
								if (game.current) game.current.changeVolume(value);
							}}
							onVolumeMuted={(value) => {
								if (game.current) game.current.mute(value);
							}}
						></CVolumeSilder>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
}

export default PGameRound;
