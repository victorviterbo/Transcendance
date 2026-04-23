import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CircleIcon from "@mui/icons-material/Circle";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MicIcon from "@mui/icons-material/Mic";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { alpha, Box, Stack } from "@mui/material";
import { useState, type ReactNode } from "react";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import { ttrn } from "../../localization/localization";
import type { IHistoryRound } from "../../types/stats";
import { formatSeconds } from "../../utils/string";
import { getScaledRadius } from "../../utils/styles";

interface PProfileMatchHistoryRoundEntryProps {
	round: IHistoryRound;
}

interface RoundMetaItemProps {
	icon?: ReactNode;
	value?: string;
	statusColor?: string;
}

function RoundMetaItem({ icon, value, statusColor }: RoundMetaItemProps) {
	return (
		<Stack direction="row" spacing={0.5} alignItems="center">
			{icon ? (
				<Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
					{icon}
				</Box>
			) : null}
			{statusColor ? <CircleIcon sx={{ fontSize: 12, color: statusColor }} /> : null}
			{value ? (
				<CText size="sm" sx={{ mb: 0 }}>
					{value}
				</CText>
			) : null}
		</Stack>
	);
}

function RoundArtworkFallback() {
	return (
		<Box
			sx={(theme) => ({
				width: 56,
				height: 56,
				flexShrink: 0,
				position: "relative",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
				borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
				background: `linear-gradient(135deg, ${alpha(
					theme.palette.primary.main,
					0.2,
				)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
				color: theme.palette.secondary.main,
			})}
		>
			<Box
				sx={(theme) => ({
					position: "absolute",
					inset: 8,
					borderRadius: "999px",
					border: `2px solid ${alpha(theme.palette.common.white, 0.28)}`,
				})}
			/>
			<Box
				sx={(theme) => ({
					position: "absolute",
					inset: 18,
					borderRadius: "999px",
					border: `2px solid ${alpha(theme.palette.common.white, 0.18)}`,
				})}
			/>
			<MusicNoteIcon sx={{ position: "relative", zIndex: 1 }} />
		</Box>
	);
}

function PProfileMatchHistoryRoundEntry({ round }: PProfileMatchHistoryRoundEntryProps) {
	const [hasArtworkError, setHasArtworkError] = useState(false);
	const shouldShowArtworkFallback = hasArtworkError || round.artworkUrl.trim().length === 0;
	const isRoundFullyFound = round.artistFound && round.songFound;

	return (
		<Stack
			direction="row"
			spacing={1.5}
			alignItems="center"
			sx={(theme) => ({
				width: "100%",
				py: 1,
				px: 0.75,
				borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
				backgroundColor: alpha(theme.palette.primary.main, 0.03),
			})}
		>
			{shouldShowArtworkFallback ? (
				<RoundArtworkFallback />
			) : (
				<Box
					component="img"
					src={round.artworkUrl}
					alt={`${round.trackArtist} - ${round.trackName}`}
					onError={() => setHasArtworkError(true)}
					sx={(theme) => ({
						width: 56,
						height: 56,
						flexShrink: 0,
						objectFit: "cover",
						borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
						backgroundColor: alpha(theme.palette.primary.main, 0.08),
					})}
				/>
			)}

			<Stack sx={{ flex: 1, minWidth: 0 }}>
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
				sx={{ flexShrink: 0 }}
			>
				{isRoundFullyFound ? (
					<RoundMetaItem
						icon={<LeaderboardIcon fontSize="small" />}
						value={ttrn(round.ranking)}
					/>
				) : null}
				{isRoundFullyFound ? (
					<RoundMetaItem
						icon={<AccessTimeIcon fontSize="small" />}
						value={formatSeconds(round.time)}
					/>
				) : null}
				<RoundMetaItem
					icon={<MicIcon fontSize="small" />}
					value={undefined}
					statusColor={round.artistFound ? "success.main" : "error.main"}
				/>
				<RoundMetaItem
					icon={<AudiotrackIcon fontSize="small" />}
					value={undefined}
					statusColor={round.songFound ? "success.main" : "error.main"}
				/>
			</Stack>
		</Stack>
	);
}

export default PProfileMatchHistoryRoundEntry;
