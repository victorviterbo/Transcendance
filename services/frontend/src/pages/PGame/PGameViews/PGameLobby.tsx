import { Box, Stack } from "@mui/material";
import type { IGamePlayer, IGameSettings, IGameStatus } from "../../../types/game";
import CTitle from "../../../components/text/CTitle";
import CText from "../../../components/text/CText";
import { ttrf, ttrfn, ttrn } from "../../../localization/localization";
import { useCallback, useMemo, type ReactNode } from "react";
import { colorFromID } from "../../../utils/styles";
import { appColors } from "../../../styles/theme";
import CButtonText from "../../../components/inputs/buttons/CButtonText";
import {
	PGameLobbyScoreTypeStyle,
	PGameLobbyTagStyle,
	PGameLobbyToggleTypeStyle,
} from "../../../styles/pages/game/PGameLobbyStyle";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import type { GameInstance } from "../../../handlers/gameHandlers";
import CCountdownCircular from "../../../components/feedback/loading/CCountdownCircular";
import { GAME_COUNTDOWNM_TIME_MS } from "../../../constants";

interface PGameLobbyProps {
	game: React.RefObject<GameInstance | undefined>;
	status: IGameStatus;
	settings: IGameSettings;
	players: IGamePlayer[];

	onOpenSettings: () => void;
}

function PGameLobby({ game, status, players, settings, onOpenSettings }: PGameLobbyProps) {
	//====================== MEMO ======================
	const host: IGamePlayer | undefined = useMemo(() => {
		const targetUser: IGamePlayer | undefined = players.find(
			(player: IGamePlayer) => player.host,
		);
		if (!targetUser) return undefined;
		return targetUser;
	}, [players]);

	//Sub comp
	const centralData = useMemo(() => {
		if (!game.current) return <></>;

		if (status.phase == "count")
			return (
				<>
					<CText sx={{ mb: "10px" }}>GAME_STARTING_IN</CText>
					<CCountdownCircular
						startColor={appColors.primary[0]}
						endColor={appColors.tertiary[0]}
						fontSize="xl"
						size="60px"
						startTime={status.keyTime}
						timeMS={GAME_COUNTDOWNM_TIME_MS}
					></CCountdownCircular>
				</>
			);

		return (
			<>
				{!game.current.isHost && (
					<CText size="lg" align="center" testid="PGameLobby-Waiting">
						{host
							? ttrfn("GAME_WAITING_START", {
									USER: (
										<span
											style={{
												color: colorFromID(
													host && host.colorid != undefined
														? host.colorid
														: 0,
												),
											}}
										>
											{host ? host.player.username : ""}
										</span>
									),
								})
							: "GAME_WAITING_START_NO_HOST"}
					</CText>
				)}
				{game.current.isHost && (
					<>
						<CButtonText
							disabled={status.phase != "waiting"}
							sx={{ mb: "15px", minWidth: "150px" }}
							onClick={onOpenSettings}
						>
							GAME_EDIT
						</CButtonText>
						<CButtonText
							sx={{ mb: "15px", minWidth: "150px" }}
							disabled={status.phase != "waiting"}
							onClick={() => {
								if (game.current) game.current.start();
							}}
						>
							GAME_START
						</CButtonText>
					</>
				)}
				<CText align="center" size="sm">
					{ttrf("GAME_PLAYER_COUNT", {
						COUNT: ttrn(players.length),
						MAX: ttrn(game.current.maxPlayers),
					})}
				</CText>
				{status.phase != "waiting" && (
					<CText sx={{ color: appColors.secondary[0] }} align="center" size="sm">
						GAME_STARTING
					</CText>
				)}
			</>
		);
	}, [game, host, players, status, onOpenSettings]);

	//====================== COMPONENTS ======================
	const genreTags: ReactNode[] = useMemo(() => {
		if (!settings.tags)
			return [
				<CText key={"no_tag"} sx={PGameLobbyTagStyle}>
					GAME_SETTINGS_NOTAG
				</CText>,
			];
		const out: ReactNode[] = Object.keys(settings.tags)
			.filter((key: string) => {
				if (!settings.tags) return false;
				return settings.tags[key];
			})
			.map((key: string) => {
				return (
					<CText key={key} sx={PGameLobbyTagStyle}>
						{key}
					</CText>
				);
			});
		if (out.length == 0) return [<CText key="no_genre">GAME_NO_GENRE</CText>];
		return out;
	}, [settings]);

	const scoreText: ReactNode = useMemo(() => {
		return (
			<CText size="sm" sx={PGameLobbyScoreTypeStyle(settings.mode)}>
				{"GAME_SETTINGS_SCORE_OPTION_" + settings.mode.toUpperCase()}
			</CText>
		);
	}, [settings]);

	const toggleSetting = useCallback((value: boolean, testid: string) => {
		return (
			<Box sx={PGameLobbyToggleTypeStyle(value)} data-testid={testid}>
				{value ? (
					<DoneIcon fontSize="small"></DoneIcon>
				) : (
					<CloseIcon fontSize="small"></CloseIcon>
				)}
			</Box>
		);
	}, []);

	const sliderValue = useCallback((label: string, value: number) => {
		return (
			<CText size="sm" testid={"PGameLobby_" + label}>
				{ttrfn(label, {
					COUNT: <span style={{ color: appColors.primary[0] }}>{value}</span>,
				})}
			</CText>
		);
	}, []);

	if (!game.current) return <></>;

	//====================== STRUCTURE ======================
	return (
		<Box data-testid="PGameLobby">
			<Stack direction="column">
				<CTitle
					sx={{ color: appColors.secondary[0], mt: "20px", mb: 0 }}
					noTr={true}
					align="center"
					size="xl"
				>
					{game.current.name}
				</CTitle>
				<Stack sx={{ mt: 0, mb: 0, justifyContent: "center" }} direction={"row"}>
					{genreTags}
				</Stack>
			</Stack>
			<Stack
				direction="column"
				sx={{
					position: "absolute",
					inset: 0,
					alignItems: "center",
					justifyContent: "center",
					zIndex: 1,
				}}
			>
				{centralData}
			</Stack>

			<Stack
				direction="row"
				sx={{
					position: "absolute",
					inset: 0,
					alignItems: "flex-end",
					justifyContent: "center",
					mb: "10px",
				}}
			>
				<Stack direction={"column"} sx={{ mr: "50px" }}>
					<Stack
						direction={"row"}
						sx={{
							alignItems: "center",
							mb: "10px",
						}}
					>
						<CText size="sm">GAME_SETTINGS_SCORE_OPTION</CText>
						{scoreText}
					</Stack>
					<Stack
						direction={"row"}
						sx={{
							alignItems: "center",
							mb: "10px",
						}}
					>
						<CText size="sm">GAME_SETTINGS_SEE_OTHERS</CText>
						{toggleSetting(settings.reveal, "GAME_SETTINGS_SEE_OTHERS")}
					</Stack>
					<Stack
						direction={"row"}
						sx={{
							alignItems: "center",
							mb: "10px",
						}}
					>
						<CText size="sm">GAME_SETTINGS_FUZZY</CText>
						{toggleSetting(settings.fuzzy, "GAME_SETTINGS_FUZZY")}
					</Stack>
				</Stack>
				<Stack direction={"column"}>
					<Stack
						direction={"row"}
						sx={{
							alignItems: "center",
							mb: "10px",
						}}
					>
						{sliderValue("GAME_SETTINGS_NB_MUSIC", settings.trackCount)}
					</Stack>
					<Stack
						direction={"row"}
						sx={{
							alignItems: "center",
							mb: "10px",
						}}
					>
						{sliderValue("GAME_SETTINGS_MUSIC_TIMER", settings.playbackDuration)}
					</Stack>
					<Stack
						direction={"row"}
						sx={{
							alignItems: "center",
							mb: "10px",
						}}
					>
						{sliderValue("GAME_SETTINGS_BREAK_TIMER", settings.breakDuration)}
					</Stack>
				</Stack>
			</Stack>
		</Box>
	);
}
export default PGameLobby;
