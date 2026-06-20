import { Box, Stack } from "@mui/material";
import type { GPageProps } from "../../common/GPageBases";
import type { IGamePlayer, IGameRound, IGameSettings } from "../../../types/game";
import { useMemo, type ReactNode } from "react";
import PGameEndedRound from "./PGameEndedRound";
import {
	PGameRoundEndedStyle,
	type IGameRoundEndedStyle,
} from "../../../styles/pages/game/PGameRoundStyle";
import StarIcon from "@mui/icons-material/Star";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import type { GameInstance } from "../../../handlers/gameHandlers";
import type { TDataInfo } from "./PGameEndedRecap";
import PGameEndedRecap from "./PGameEndedRecap";
import CButton from "../../../components/inputs/buttons/CButton";
import { GAME_ENDED_MAX } from "../../../constants";

interface PGameEndedProps extends GPageProps {
	game: React.RefObject<GameInstance | undefined>;
	rounds: IGameRound[];
	settings: IGameSettings;
	players: IGamePlayer[];
}

function PGameEnded({ game, rounds, settings, players }: PGameEndedProps) {
	const style: IGameRoundEndedStyle = useMemo(() => {
		return PGameRoundEndedStyle();
	}, []);

	const roundList = useMemo((): ReactNode => {
		return rounds.map((round: IGameRound, index: number) => {
			return (
				<PGameEndedRound
					key={"PGameEndedRound-" + index}
					round={round}
					settings={settings}
				/>
			);
		});
	}, [rounds, settings]);

	//====================== DATA ======================
	const ptsInfo: TDataInfo = useMemo(() => {
		let best = 0;
		let count = 0;
		let value = 0;
		rounds.forEach((round: IGameRound) => {
			if (round.ranking == 0) return;
			value += round.points;
			count++;
			if (round.points > best) best = round.points;
		});
		return {
			avr: count == 0 ? 0 : Math.round((value / count) * 10) / 10,
			best,
			total: value,
		};
	}, [rounds]);

	const rankInfo: TDataInfo = useMemo(() => {
		let best = GAME_ENDED_MAX;
		let count = 0;
		let value = 0;
		rounds.forEach((round: IGameRound) => {
			if (round.ranking == 0) return;
			value += round.ranking;
			count++;
			if (round.ranking < best) best = round.ranking;
		});
		return {
			avr: count == 0 ? GAME_ENDED_MAX : Math.round((value / count) * 10) / 10,
			best,
			lead:
				!game.current || !game.current.self
					? 0
					: players.findIndex((player) => player.user.uid == game.current?.self?.uid) + 1,
		};
	}, [rounds, players, game]);

	const timeInfo: TDataInfo = useMemo(() => {
		let best = GAME_ENDED_MAX;
		let count = 0;
		let worst = 0;
		let value = 0;
		rounds.forEach((round: IGameRound) => {
			if (round.ranking == 0) return;
			value += round.time;
			count++;
			if (round.time < best) best = round.time;
			if (round.time > worst && round.time < settings.playbackDuration) worst = round.time;
		});
		return {
			avr: count == 0 ? GAME_ENDED_MAX : Math.round((value / count) * 100) / 100,
			best: Math.round(best * 100) / 100,
			worst: Math.round(worst * 100) / 100,
		};
	}, [rounds, settings]);

	return (
		<Stack sx={{ flex: 1, position: "absolute", inset: "5px" }} direction={"column"}>
			<Box sx={style.box}>
				<Stack direction={"column"}>
					<Stack direction={{ xs: "column", sm: "row" }}>
						<PGameEndedRecap node={<StarIcon />} info={ptsInfo} />
						<PGameEndedRecap node={<LeaderboardIcon />} info={rankInfo} />
						<PGameEndedRecap node={<AccessTimeIcon />} info={timeInfo} />
					</Stack>
				</Stack>
			</Box>
			<Stack direction={"column"} sx={{ mt: "10px", mx: "5px", flex: 1, overflow: "auto" }}>
				{roundList}
			</Stack>
			<Stack direction={"row"} sx={style.bottom}>
				<CButton sx={{ mr: "10px" }}>GAME_ENDED_BACK</CButton>
				<CButton sx={{ ml: "10px" }}>GAME_ENDED_AGAIN</CButton>
			</Stack>
		</Stack>
	);
}

export default PGameEnded;
