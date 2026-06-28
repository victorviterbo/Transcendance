import { Grid, Stack, useMediaQuery } from "@mui/material";
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
import type { IWSGameRCVEventLeave, IWSGameSendEvent, TWSRcv } from "../../types/websocket";
import { GameInstance } from "../../handlers/gameHandlers";
import PGameViews from "./PGameViews";
import { useNavigate, useParams, type NavigateFunction } from "react-router-dom";
import PGameLeaveConfirmDialog from "./PGameLeaveConfirmDialog";
import useGameLeaveGuard from "./useGameLeaveGuard";
import { useNotif } from "../../components/contexts/CAppNotifContext";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { PAGE_GAME } from "../../constants";
import PGameInteractDialog from "./PGameInteractDialog";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import CToggle from "../../components/inputs/toggle/CToggle";

function PGame() {
	//STYLING
	const spacing: number = appPositions.gameSpacing;

	//SYSTEM
	const navigate: NavigateFunction = useNavigate();
	const { push } = useNotif();
	const [error, setError] = useState<string | undefined>(undefined);
	const [inGame, setInGame] = useState<string | undefined>(undefined);
	const [songPlayable, setSongPlayable] = useState<boolean>(true);

	//GAME
	const { gameid } = useParams();

	const game: React.RefObject<GameInstance | undefined> = useRef<GameInstance | undefined>(
		undefined,
	);
	const [sessionState, setSessionState] = useState<TGameSessionState>("loading");
	const leaveGuard = useGameLeaveGuard(sessionState);
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

	//MOBILE
	const viewBreakPoints = useMediaQuery("(min-width:1300px)");
	const [currentView, setCurrentView] = useState<"chat" | "game" | "leaderboard">("game");

	//====================== WS ======================
	const wsContext = useWS("game");

	//====================== MANAGEMENT ======================

	//--------------------- HANDLERS ---------------------
	const clearGame = useCallback(() => {
		setSessionState("ended");
		if (game.current) {
			game.current.destroy();
			delete game.current;
			game.current = undefined;
		}
	}, [game, setSessionState]);

	const handleLeaveGame = useCallback(() => {
		clearGame();
		leaveGuard.leave();
	}, [leaveGuard, clearGame]);

	const handleLeave = useCallback(() => {
		clearGame();
		if (inGame == undefined) {
			navigate("/");
			return;
		}
		navigate(PAGE_GAME.replaceAll("{UID}", inGame));
		setInGame(undefined);
	}, [inGame, setInGame, navigate, clearGame]);

	const handleStay = useCallback(() => {
		if (game.current && inGame != undefined) {
			game.current.send({
				target: "game",
				event: "player_leave",
				uid: inGame,
			} as IWSGameRCVEventLeave);
			game.current.join();
			setInGame(undefined);
		} else {
			clearGame();
			navigate("/");
		}
	}, [navigate, setInGame, game, inGame, clearGame]);

	//--------------------- EFFECTs ---------------------
	useEffect(() => {
		async function setLoading() {
			setSessionState("loading");
		}

		if (sessionState != "loading") return;

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
			setInGame,
			setSongPlayable,
			answerRef,
		});
	}, [gameid, wsContext, answerRef, push, sessionState]);

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
			setInGame,
			setSongPlayable,
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
		setInGame,
		setSongPlayable,
		wsContext,
		answerRef,
	]);

	useEffect(() => {
		if (!gameid) return;
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | IWSGameSendEvent | undefined = wsContext.getLast();
				if (!last || last.target != "game" || !game.current) return;
				game.current.rcv(last as IWSGameSendEvent);
			}
		});
	}, [wsContext, gameid]);

	useEffect(() => {
		if (sessionState != "joined" && error != undefined) {
			async function clear() {
				clearGame();
			}
			clear();
			navigate("/");
		}
	}, [error, sessionState, navigate, clearGame]);

	//====================== BUILD ======================
	//--------------------- IN GAME ---------------------
	if (inGame != undefined) {
		return (
			<CGamePaper
				contentFlex={1}
				sx={{
					position: "relative",
					maxWidth: "600px",
					maxHeight: "400px",
					mt: "50px",
					mx: "auto",
				}}
				title={"GAME_ALREADY_IN_GAME_TITLE"}
			>
				<Stack alignItems="center" sx={{ pt: 1, minWidth: { xs: 0, sm: 360 } }}>
					<CText align="center">GAME_ALREADY_IN_GAME_MESSAGE</CText>
					<Stack direction={"row"} sx={{ mt: "20px", mb: "20px" }}>
						<CButtonText sx={{ mr: "5px" }} onClick={handleLeave}>
							GAME_ALREADY_IN_GAME_RETURN
						</CButtonText>
						<CButtonText sx={{ ml: "5px" }} onClick={handleStay}>
							GAME_ALREADY_IN_GAME_JOIN
						</CButtonText>
					</Stack>
				</Stack>
			</CGamePaper>
		);
	}

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
					alignItems: "stretch",
					overflow: { md: "auto" },
				}}
				direction={"column"}
			>
				{viewBreakPoints && (
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
				)}
				{!viewBreakPoints && (
					<>
						<Stack
							sx={{ justifyContent: "center", mt: "5px", mb: "15px" }}
							direction={"row"}
						>
							<CToggle
								options={[
									{
										value: "leaderboard",
										label: "",
										icon: <LeaderboardIcon fontSize="small" />,
									},
									{
										value: "game",
										label: "",
										icon: <MicExternalOnIcon fontSize="small" />,
									},
									{
										value: "chat",
										label: "",
										icon: <ChatBubbleIcon fontSize="small" />,
									},
								]}
								value={currentView}
								onValueChanged={(value: string) => {
									setCurrentView(value as "chat" | "game" | "leaderboard");
								}}
								allowUnselect={false}
							></CToggle>
						</Stack>
						{currentView == "leaderboard" && <PGameLBoard players={players} />}
						{currentView == "game" && (
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
						)}
						{currentView == "chat" && <PGameChat game={game} chat={chat} />}
					</>
				)}
			</Stack>
			<PGameLeaveConfirmDialog
				open={leaveGuard.blocked}
				onStay={leaveGuard.stay}
				onLeave={handleLeaveGame}
			/>
			<PGameInteractDialog
				open={!songPlayable}
				onInteract={() => {
					if (game.current) game.current.updatePlayable(true);
				}}
			></PGameInteractDialog>
		</>
	);
}

export default PGame;
