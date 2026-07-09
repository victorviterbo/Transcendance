import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CircleIcon from "@mui/icons-material/Circle";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MicExternalOnIcon from "@mui/icons-material/MicExternalOn";
import { Box, Stack } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import type { IHistoryRound } from "../../types/stats";
import CCover from "../../components/images/CCover";
import {
	PProfileMatchHistoryStyle,
	type IProfileMatchHistoryStyle,
} from "../../styles/pages/profile/PProfileMatchHistoryStyle";
import { useLang } from "../../components/contexts/CLanguageProvider";

interface PProfileMatchHistoryRoundEntryProps {
	round: IHistoryRound;
}

interface RoundMetaItemProps {
	icon?: ReactNode;
	style: IProfileMatchHistoryStyle;
	value?: string;
	statusColor?: string;
}

function RoundMetaItem({ icon, style, value, statusColor }: RoundMetaItemProps) {
	return (
		<Stack direction="row" spacing={0.5} alignItems="center">
			{icon ? <Box sx={style.roundMetaIcon}>{icon}</Box> : null}
			{statusColor ? <CircleIcon sx={style.roundStatusIcon(statusColor)} /> : null}
			{value ? (
				<CText size="sm" sx={{ mb: 0 }}>
					{value}
				</CText>
			) : null}
		</Stack>
	);
}

function PProfileMatchHistoryRoundEntry({ round }: PProfileMatchHistoryRoundEntryProps) {
	const style: IProfileMatchHistoryStyle = useMemo(() => {
		return PProfileMatchHistoryStyle();
	}, []);

	const { ttrn, formatSeconds } = useLang();

	const roundInfos = useMemo(() => {
		const isRoundFullyFound = round.artistFound && round.titleFound;

		return {
			artistStatusColor: style.roundStatusColor(round.artistFound),
			coverAlt: `${round.trackArtist} - ${round.trackName}`,
			isRoundFullyFound,
			rankingLabel: isRoundFullyFound ? ttrn(round.ranking) : undefined,
			songStatusColor: style.roundStatusColor(round.titleFound),
			timeLabel: isRoundFullyFound ? formatSeconds(round.time) : undefined,
		};
	}, [round, style, formatSeconds, ttrn]);

	return (
		<Stack
			direction={{ xs: "column", sm: "row" }}
			spacing={1.5}
			alignItems="center"
			sx={style.roundEntry}
		>
			<CCover url={round.artworkUrl} alt={roundInfos.coverAlt}></CCover>
			<Stack sx={{ flex: 1, minWidth: 0 }} alignItems={{ xs: "center", sm: "flex-start" }}>
				<CTitle size="sm" sx={{ mb: 0 }}>
					{round.trackArtist}
				</CTitle>
				<CText size="sm" sx={{ mb: 0 }}>
					{round.trackName}
				</CText>
			</Stack>

			<Stack
				direction="row"
				spacing={{ xs: 1, md: 1.5 }}
				alignItems="center"
				useFlexGap
				flexWrap="wrap"
				justifyContent="flex-end"
				sx={{ mt: { xs: "15px", sm: "0" }, flexShrink: 0 }}
			>
				{roundInfos.isRoundFullyFound ? (
					<RoundMetaItem
						icon={<LeaderboardIcon fontSize="small" />}
						style={style}
						value={roundInfos.rankingLabel}
					/>
				) : null}
				{roundInfos.isRoundFullyFound ? (
					<RoundMetaItem
						icon={<AccessTimeIcon fontSize="small" />}
						style={style}
						value={roundInfos.timeLabel}
					/>
				) : null}
				<RoundMetaItem
					icon={<MicExternalOnIcon fontSize="small" />}
					style={style}
					value={undefined}
					statusColor={roundInfos.artistStatusColor}
				/>
				<RoundMetaItem
					icon={<AudiotrackIcon fontSize="small" />}
					style={style}
					value={undefined}
					statusColor={roundInfos.songStatusColor}
				/>
			</Stack>
		</Stack>
	);
}

export default PProfileMatchHistoryRoundEntry;
