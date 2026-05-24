import { Box, Grid, Stack } from "@mui/material";
import CText from "../../../components/text/CText";
import CTextField from "../../../components/inputs/textFields/CTextField";
import SendIcon from "@mui/icons-material/Send";
import CIconButton from "../../../components/inputs/buttons/CIconButton";
import { appColors, appTexts } from "../../../styles/theme";
import { ttrfn } from "../../../localization/localization";
import type { GPageProps } from "../../common/GPageBases";
import type {
	IGameData,
	IGamePlayer,
	IGamePlayerAnswer,
	IGameRound,
	IGameSettings,
	IGameStatus,
} from "../../../types/game";
import { useMemo, type ReactNode } from "react";
import PGameRoundStateNode from "./PGameRoundStateNode";
import CCounterCircular from "../../../components/feedback/loading/CCounterCircular";
import PGameRoundTracker from "./PGameRoundTracker";
import PGameRoundAnswer from "./PGameRoundAnswer";
import { PGameRoundStyle, type IGameRoundStyle } from "../../../styles/pages/game/PGameRoundStyle";

interface PGameRoundProps extends GPageProps {
	players: IGamePlayer[];
	game: IGameData;
	status: IGameStatus;
	settings: IGameSettings;
	rounds: IGameRound[];
}

function PGameRound({ players, status, rounds, settings }: PGameRoundProps) {
	//====================== MAPS ======================
	const roundHistory = useMemo((): ReactNode[] => {
		return rounds.map((round: IGameRound, index: number) => {
			return (
				<PGameRoundStateNode
					key={"round-node-" + index}
					round={round}
				></PGameRoundStateNode>
			);
		});
	}, [rounds]);

	const answerHistory = useMemo((): ReactNode[] => {
		return rounds[status.round].answers.map((answer: IGamePlayerAnswer, index: number) => {
			return (
				<Grid size={6} key={"answer-node-" + index}>
					<PGameRoundAnswer variant="answer" answer={answer} />
				</Grid>
			);
		});
	}, [rounds, status]);

	const playerTimes = useMemo((): ReactNode[] => {
		console.log(players);
		const answeredPlayers = players.filter((player: IGamePlayer) => {
			return (
				(player.current.artistFound || player.current.titleFound) &&
				player.current.lastestTime >= 0
			);
		});

		return answeredPlayers.map((player: IGamePlayer) => {
			return (
				<PGameRoundAnswer
					variant="time"
					key={player.user.uid}
					answer={{
						message: player.user.username,
						time: player.current.lastestTime,
						titleFound: player.current.titleFound,
						artistFound: player.current.artistFound,
					}}
				></PGameRoundAnswer>
			);
		});
	}, [players]);

	//====================== STYLE ======================
	const style: IGameRoundStyle = useMemo(() => {
		return PGameRoundStyle();
	}, []);

	//====================== STRUCTURE ======================
	return (
		<Stack
			direction={"column"}
			sx={{ position: "absolute", inset: "15px", overflowY: "auto", overflowX: "hidden" }}
		>
			<Box sx={style.progressBox}>
				<Stack direction={"column"}>
					<Stack direction={"row"}>
						<CText>
							{ttrfn("GAME_ROUND_INDICATOR", {
								CURRENT: <span>{status.round + 1}</span>,
								MAX: <span>{settings.nbMusic}</span>,
							})}
						</CText>
						<Stack direction={"row"}>{roundHistory}</Stack>
					</Stack>
					<PGameRoundTracker
						settings={settings}
						status={status}
						round={rounds[status.round]}
					/>
				</Stack>
			</Box>
			<Box></Box>
			<Stack direction={"row"} sx={{ flex: 1, overflow: "hidden" }}>
				<Stack
					sx={{ flex: 0.7, my: "10px", p: "5px", overflowX: "hidden", overflowY: "auto" }}
					direction={"column"}
				>
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
							<CText sx={{ color: appColors.primary[0] }}>5</CText>
							<CText sx={{ color: appColors.cancel[0] }}>0</CText>
							<CText sx={{ color: appColors.secondary[0] }}>3</CText>
						</Stack>
						<Stack direction={"column"} sx={style.pointBoxPointSumup}>
							<CText size="lg">13</CText>
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
			<Stack direction={"row"}>
				<CTextField
					sx={{ flex: 1, m: 0 }}
					fontWeight={500}
					fontFamily={appTexts.text.secondaryFamily}
					fontSize={appTexts.text.sizes.xs}
					borderWidth="2px"
					verticalPadding="10px"
					// value={messageField}
					// onChange={(event) => {
					// 	setMessageField(event.target.value);
					// }}
					// onKeyUp={(event) => {
					// 	if (event.code == "Enter") handleSendMessage();
					// }}
					data-testid="PGameChat-TextField"
				></CTextField>
				<CIconButton
					//onClick={handleSendMessage}
					sx={{ my: "auto", ml: "10px" }}
					data-testid="PGameChat-SendButton"
				>
					<SendIcon fontSize="small" />
				</CIconButton>
				<CCounterCircular min={0} max={30} variant="determinate" value={25} />
			</Stack>
		</Stack>
	);
}

export default PGameRound;
