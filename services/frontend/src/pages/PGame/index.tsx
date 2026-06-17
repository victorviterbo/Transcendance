import { Grid, Stack } from "@mui/material";
import { appColors, appPositions } from "../../styles/theme";
//import { useRef } from "react";
import PGameLBoard from "./PGameLBoard";
import PGameChat from "./PGameChat";
import { createRef, useCallback, useEffect, useRef, useState } from "react";
import type {
	TGameSessionState,
	IGameChatMsg,
	IGamePlayer,
	IGamePlayerResult,
	IGameRound,
	IGameSettings,
	IGameStatus,
} from "../../types/game";
import { useWS } from "../../components/websocket/CWebsocket";
import CGamePaper from "../../components/surfaces/CGamePaper";
import CText from "../../components/text/CText";
import type { IWSGameSendEvent, TWSRcv } from "../../types/websocket";
import { GameInstance } from "../../handlers/gameHandlers";
import PGameViews from "./PGameViews";
import { useNavigate, useParams, type NavigateFunction } from "react-router-dom";
import PGameLeaveConfirmDialog from "./PGameLeaveConfirmDialog";
import useGameLeaveGuard from "./useGameLeaveGuard";
import { useNotif } from "../../components/contexts/CAppNotifContext";

function PGame() {
	//STYLING
	const spacing: number = appPositions.gameSpacing;

	//SYSTEM
	const navigate: NavigateFunction = useNavigate();
	const { push } = useNotif();
	const [error, setError] = useState<string | undefined>(undefined);

	//GAME
	const { gameid } = useParams();

	const game: React.RefObject<GameInstance | undefined> = useRef<GameInstance | undefined>(
		undefined,
	);
	const [sessionState, setSessionState] = useState<TGameSessionState>("loading");
	const leaveGuard = useGameLeaveGuard(sessionState);
	const handleLeaveGame = useCallback(() => {
		game.current?.leave();
		leaveGuard.leave();
	}, [leaveGuard]);
	const [status, setStatus] = useState<IGameStatus | undefined>();
	const [rounds, setRounds] = useState<IGameRound[]>([]);
	const [volume, setVolume] = useState<number>(50);
	const [muted, setMuted] = useState<boolean>(false);

	//Updatable Data
	const [players, setPlayers] = useState<IGamePlayer[]>([]);
	const [results, setResults] = useState<IGamePlayerResult[]>([]);
	const [chat, setChat] = useState<IGameChatMsg[]>([]);

	//SETTINGS
	const [settings, setSettings] = useState<IGameSettings | undefined>(undefined);

	//REFS
	const answerRef = createRef<HTMLDivElement | null>();

	//====================== WS ======================
	const wsContext = useWS("game");

	//====================== MANAGEMENT ======================
	useEffect(() => {
		async function setLoading() {
			setSessionState("loading");
		}

		if (!gameid || (game.current && game.current.uid == gameid)) return;

		if (game.current) {
			game.current.destroy();
			delete game.current;
			game.current = undefined;
			setLoading();
		}

		game.current = new GameInstance(gameid, {
			setSessionState,
			setStatus,
			setSettings,
			setRounds,
			setPlayers,
			setResults,
			setChat,
			setVolume,
			setMuted,
			sendMessage: wsContext.sendMessage,
			push,
			setError,
			answerRef,
		});
	}, [gameid, wsContext, answerRef, push]);

	useEffect(() => {
		if (!game.current) return;
		game.current.callbacks = {
			setSessionState,
			setStatus,
			setSettings,
			setRounds,
			setPlayers,
			setResults,
			setChat,
			setVolume,
			setMuted,
			sendMessage: wsContext.sendMessage,
			push,
			setError,
			answerRef,
		};
	}, [
		setSessionState,
		setStatus,
		setSettings,
		setRounds,
		setPlayers,
		setResults,
		setChat,
		setVolume,
		setMuted,
		push,
		setError,
		wsContext,
		answerRef,
	]);

	useEffect(() => {
		if (!gameid) return;
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | IWSGameSendEvent | undefined = wsContext.getLast();
				if (!last || last.target != "game" || !game.current) return;
				game.current.rcv(last);
			}
		});
	}, [wsContext, gameid]);

	useEffect(() => {
		if (sessionState != "joined" && error != undefined) {
			navigate("/");
		}
	}, [error, sessionState, navigate]);

	//====================== BUILD ======================
	//--------------------- EROR ---------------------
	if (gameid == undefined || error != undefined) {
		return (
			<CGamePaper
				contentFlex={1}
				sx={{
					position: "relative",
					maxWidth: "500px",
					maxHeight: "150px",
					mt: "50px",
					mx: "auto",
				}}
				title={"GAME_ERROR_TITLE"}
			>
				<CText align="center" sx={{ my: "auto", color: appColors.cancel[0] }}>
					{error != undefined ? error : "GAME_ERROR_INVALID_ROOM"}
				</CText>
			</CGamePaper>
		);
	}

	//--------------------- LOADIN ---------------------
	if (sessionState === "loading" || !settings || !status) {
		return (
			<CGamePaper
				contentFlex={1}
				sx={{
					position: "relative",
					maxWidth: "500px",
					maxHeight: "150px",
					mt: "50px",
					mx: "auto",
				}}
				title={"GAME_LOADING_TITLE"}
			>
				<CText align="center" sx={{ my: "auto" }}>
					GAME_LOADING
				</CText>
			</CGamePaper>
		);
	}

	//--------------------- FINAL ---------------------
	return (
		<>
			<Stack
				sx={{
					position: "absolute",
					inset: 0,
				}}
			>
				<Grid
					container
					spacing={spacing}
					sx={{
						position: "absolute",
						inset: 0,
						p: spacing,
					}}
				>
					<Grid size={3}>
						<PGameLBoard players={players} />
					</Grid>
					<Grid size={6}>
						<PGameViews
							status={status}
							rounds={rounds}
							players={players}
							results={results}
							game={game}
							settings={settings}
							volume={volume}
							muted={muted}
							answerRef={answerRef}
						/>
					</Grid>
					<Grid size={3}>
						<PGameChat game={game} chat={chat} />
					</Grid>
				</Grid>
			</Stack>
			<PGameLeaveConfirmDialog
				open={leaveGuard.blocked}
				onStay={leaveGuard.stay}
				onLeave={handleLeaveGame}
			/>
		</>
	);
}

export default PGame;
