import { Grid, Stack } from "@mui/material";
import { appColors, appPositions } from "../../styles/theme";
//import { useRef } from "react";
import PGameLBoard from "./PGameLBoard";
import PGameChat from "./PGameChat";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type {
	IGameChatMsg,
	IGameData,
	IGameDataRes,
	IGamePlayer,
	IGameRound,
	IGameSettings,
	IGameStatus,
} from "../../types/game";
import { useWS } from "../../components/websocket/CWebsocket";
import { gameFetchData } from "../../api/game";
import CGamePaper from "../../components/surfaces/CGamePaper";
import CText from "../../components/text/CText";
import type { IWSGameSendEvent, TWSRcv, TWSSend } from "../../types/websocket";
import { API_GAME } from "../../constants";
import {
	GameInstance,
	gameOnMessageNew,
	gameOnMessageUpdate,
	gameOnPlayerJoin,
	gameOnPlayerLeave,
	gameOnPlayerUpdate,
	gameOnSettingsUpdate,
} from "../../handlers/gameHandlers";
import PGameViews from "./PGameViews";
import { useParams } from "react-router-dom";

function PGame() {
	//STYLING
	const spacing: number = appPositions.gameSpacing;

	//ERROR
	const [error, setError] = useState<ReactNode | undefined>(undefined);

	//GAME
	const { gameid } = useParams();
	
	const game: React.RefObject<GameInstance | undefined> = useRef<GameInstance | undefined>(undefined);
	const [ready, setReady] = useState<boolean>(false)
	const [status, setStatus] = useState<IGameStatus | undefined>();
	const [rounds, setRounds] = useState<IGameRound[]>([]);

	//Updatable Data
	const [players, setPlayers] = useState<IGamePlayer[]>([]);
	const [chat, setChat] = useState<IGameChatMsg[]>([]);

	//SETTINGS
	const [settings, setSettings] = useState<IGameSettings | undefined>(undefined);

	//====================== WS ======================
	const wsContext = useWS("game");

	//====================== MANAGEMENT ======================
	useEffect(() => {

		async function setFalse()
		{
			setReady(false);
		}

		if(!gameid || (game.current && game.current.uid == gameid))
			return;
		
		if(game.current) {
			game.current.destroy()
			delete game.current;
			game.current = undefined
			setFalse();
		}

		game.current = new GameInstance(gameid, {
			setReady,
			setError,
			setStatus,
			setSettings,
			setPlayers,
			sendMessage: wsContext.sendMessage,
		})

	}, [gameid, wsContext]);

	useEffect(() => {

		if(!game.current)
			return;
		game.current.callbacks = {
			setReady,
			setError,
			setStatus,
			setSettings,
			setPlayers,
			sendMessage: wsContext.sendMessage,
		}

	}, [setReady, setError, wsContext]);

	// useEffect(() => {
	// 	if (gameid == undefined) return;
	// 	gameFetchData<IGameData | undefined, IGameDataRes, "game">(
	// 		API_GAME.replaceAll("{ROOMID}", gameid),
	// 		"game",
	// 		setGameData,
	// 		setError,
	// 		undefined,
	// 		"GAME_ERROR_GLOBAL",
	// 		(data: IGameData | undefined) => {
	// 			if (!data) return;
	// 			setStatus(data.status);
	// 			setRounds(data.rounds);
	// 			setUsers(data.players);
	// 			setChat(data.chat);
	// 			setSettings(data.settings);
	// 		},
	// 	);
	// }, [setGameData, gameid]);

	//====================== WS ======================
	// const sendWSMessage = useCallback(
	// 	(sentData: Omit<TWSSend, "target">) => {
	// 		if (!gameData) return;
	// 		const retData = {
	// 			target: "game",
	// 			gameid: gameData.id,
	// 			gameuid: gameData.uid,
	// 			...sentData,
	// 		};
	// 		wsContext.sendMessage(JSON.stringify(retData));
	// 	},
	// 	[gameData, wsContext],
	// );

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

	// useEffect(() => {
	// 	if (!gameData) return;
	// 	const nSentData: TWSSend = {
	// 		target: "game",
	// 		event: "join",
	// 		gameid: gameData.id,
	// 		gameuid: gameData.uid,
	// 	};
	// 	sendWSMessage(nSentData);
	// }, [gameData, sendWSMessage]);

	// //====================== EVENTS ======================
	// const onSettingsChanged = useCallback(
	// 	(newSettings: IGameSettings) => {
	// 		sendWSMessage({
	// 			event: "settings-update",
	// 			settings: newSettings,
	// 		});
	// 	},
	// 	[sendWSMessage],
	// );

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
						onSettingsChanged={(_: IGameSettings) => {}/* onSettingsChanged*/}
						status={status}
						rounds={rounds}
						players={players}
						game={game}
						settings={settings}
					/>
				</Grid>
				<Grid size={3}>
					<PGameChat sendWSMessage={(_: Omit<TWSSend, "target">) => {}/*sendWSMessage*/} players={players} chat={chat} />
				</Grid>
			</Grid>
		</Stack>
	);
}

export default PGame;
