import { Grid, Stack } from "@mui/material";
import { appColors, appPositions } from "../../styles/theme";
//import { useRef } from "react";
import PGameLBoard from "./PGameLBoard";
import PGameChat from "./PGameChat";
import { createRef, useEffect, useRef, useState, type ReactNode } from "react";
import type {
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
import { useParams } from "react-router-dom";

function PGame() {
	//STYLING
	const spacing: number = appPositions.gameSpacing;

	//ERROR
	const [error, setError] = useState<ReactNode | undefined>(undefined);

	//GAME
	const { gameid } = useParams();

	const game: React.RefObject<GameInstance | undefined> = useRef<GameInstance | undefined>(
		undefined,
	);
	const [ready, setReady] = useState<boolean>(false);
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
		async function setFalse() {
			setReady(false);
		}

		if (!gameid || (game.current && game.current.uid == gameid)) return;

		if (game.current) {
			game.current.destroy();
			delete game.current;
			game.current = undefined;
			setFalse();
		}

		game.current = new GameInstance(gameid, {
			setReady,
			setError,
			setStatus,
			setSettings,
			setRounds,
			setPlayers,
			setResults,
			setChat,
			setVolume,
			setMuted,
			sendMessage: wsContext.sendMessage,
			answerRef,
		});
	}, [gameid, wsContext, answerRef]);

	useEffect(() => {
		if (!game.current) return;
		game.current.callbacks = {
			setReady,
			setError,
			setStatus,
			setSettings,
			setRounds,
			setPlayers,
			setResults,
			setChat,
			setVolume,
			setMuted,
			sendMessage: wsContext.sendMessage,
			answerRef,
		};
	}, [setReady, setError, setStatus, setSettings, setPlayers, wsContext, answerRef]);

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

	//====================== BUILD ======================
	//--------------------- EROR ---------------------
	if (gameid == undefined || error) {
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
				{gameid == undefined ? (
					<CText align="center" sx={{ my: "auto", color: appColors.cancel[0] }}>
						GAME_ERROR_INVALID_ROOM
					</CText>
				) : (
					error
				)}
			</CGamePaper>
		);
	}

	//--------------------- LOADIN ---------------------
	if (!ready || !settings || !status) {
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
	);
}

export default PGame;
