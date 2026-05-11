import { Box, Stack } from "@mui/material";
import type { IGameData, IGamePlayer } from "../../../types/game";
import CTitle from "../../../components/text/CTitle";
import CText from "../../../components/text/CText";
import { ttrf, ttrfn, ttrn } from "../../../localization/localization";
import { useMemo } from "react";
import { colorFromID } from "../../../utils/styles";
import { appColors } from "../../../styles/theme";
import CButtonText from "../../../components/inputs/buttons/CButtonText";

interface PGameLobbyProps {
	game: IGameData;
	players: IGamePlayer[];

	onOpenSettings: () => void;
}

function PGameLobby({ players, game, onOpenSettings }: PGameLobbyProps) {
	const host: IGamePlayer | undefined = useMemo(() => {
		const targetUser: IGamePlayer | undefined = players.find(
			(player: IGamePlayer) => player.host,
		);
		if (!targetUser) return undefined;
		return targetUser;
	}, [players]);

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
				<CText sx={{ mt: 0, mb: 0 }} align="center" size="sm">
					{"<THEMES>"}
				</CText>
			</Stack>
			<Stack
				direction="column"
				sx={{
					position: "absolute",
					inset: 0,
					alignItems: "center",
					justifyContent: "center",
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
		</Box>
	);
}
export default PGameLobby;
