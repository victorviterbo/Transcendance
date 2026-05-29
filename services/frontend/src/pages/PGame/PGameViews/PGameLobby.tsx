import { Box, Stack } from "@mui/material";
import type { IGameData, IGamePlayer, IGameSettings } from "../../../types/game";
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

interface PGameLobbyProps {
	game: IGameData;
	settings: IGameSettings;
	players: IGamePlayer[];

	onOpenSettings: () => void;
}

function PGameLobby({ players, game, settings, onOpenSettings }: PGameLobbyProps) {
	const host: IGamePlayer | undefined = useMemo(() => {
		const targetUser: IGamePlayer | undefined = players.find(
			(player: IGamePlayer) => player.host,
		);
		if (!targetUser) return undefined;
		return targetUser;
	}, [players]);

	//====================== COMPONENTS ======================
	const genreTags: ReactNode[] = useMemo(() => {
		if(!settings.tags)
			return [<CText key={"no_tag"} sx={PGameLobbyTagStyle}>
						GAME_SETTINGS_NOTAG
					</CText>]
		const out: ReactNode[] = Object.keys(settings.tags)
			.filter((key: string) => {
				if(!settings.tags)
					return false;
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
					{game.name}
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
				{!game.isHost && (
					<CText size="lg" align="center" testid="PGameLobby-Waiting">
						{host
							? ttrfn("GAME_WAITING_START", {
									USER: (
										<span
											style={{ color: colorFromID(host ? host.colorid : 0) }}
										>
											{host ? host.user.username : ""}
										</span>
									),
								})
							: "GAME_WAITING_START_NO_HOST"}
					</CText>
				)}
				{game.isHost && (
					<>
						<CButtonText
							sx={{ mb: "15px", minWidth: "150px" }}
							onClick={onOpenSettings}
						>
							GAME_EDIT
						</CButtonText>
						<CButtonText sx={{ mb: "15px", minWidth: "150px" }}>GAME_START</CButtonText>
					</>
				)}
				<CText align="center" size="sm">
					{ttrf("GAME_PLAYER_COUNT", {
						COUNT: ttrn(players.length),
						MAX: ttrn(game.maxPlayers),
					})}
				</CText>
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
