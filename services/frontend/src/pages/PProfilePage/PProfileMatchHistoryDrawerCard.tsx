import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	alpha,
	Avatar,
	ButtonBase,
	Box,
	Chip,
	Divider,
	List,
	ListItem,
	ListItemText,
	Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { resolveProfileImage } from "../../api/profile";
import CTabs from "../../components/navigation/CTabs";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import { ttr, ttrd, ttrf, ttrn } from "../../localization/localization";
import type { IHistoryEntry } from "../../types/stats";
import { getScaledRadius } from "../../utils/styles";
import PProfileMatchHistoryRoundEntry from "./PProfileMatchHistoryRoundEntry";

interface PProfileMatchHistoryDrawerCardProps {
	entry: IHistoryEntry;
}

function PProfileMatchHistoryDrawerCard({ entry }: PProfileMatchHistoryDrawerCardProps) {
	const navigate = useNavigate();
	const playedAtLabel = ttrd(entry.playedAt, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
	const rankingLabel = ttrf("HISTORY_RANKING", {
		rank: ttrn(entry.ranking),
		players: ttrn(entry.players.length),
	});
	const scoreLabel = ttrf("HISTORY_SCORE", {
		score: ttrn(entry.xpEarned),
	});

	return (
		<Accordion
			disableGutters
			sx={(theme) => ({
				borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
				backgroundColor: alpha(theme.palette.primary.main, 0.06),
				border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
				"&:before": {
					display: "none",
				},
			})}
		>
			<AccordionSummary
				expandIcon={<ExpandMoreIcon />}
				sx={{ px: 2, py: 1 }}
				aria-controls={`match-history-${entry.playedAt}`}
				id={`match-history-${entry.playedAt}-header`}
			>
				<Stack spacing={1.5} sx={{ width: "100%" }}>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={1}
						justifyContent="space-between"
						alignItems={{ xs: "flex-start", sm: "center" }}
					>
						<Stack spacing={0.35}>
							<CTitle size="sm" sx={{ mb: 0 }}>
								{entry.roomTitle}
							</CTitle>
							<CText size="sm" sx={{ mb: 0 }}>
								{playedAtLabel}
							</CText>
						</Stack>
						<Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
							<CText size="sm" sx={{ mb: 0 }}>
								{scoreLabel}
							</CText>
							<CText size="sm" sx={{ mb: 0 }}>
								{rankingLabel}
							</CText>
						</Stack>
					</Stack>
					<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
						{entry.tags.map((tag) => (
							<Chip key={tag} size="small" label={ttr(tag)} />
						))}
					</Stack>
				</Stack>
			</AccordionSummary>

			<AccordionDetails sx={{ px: 2, pb: 2 }}>
				<CTabs tabs={["HISTORY_ROUNDS", "HISTORY_PLAYERS"]}>
					<Box>
						<List disablePadding>
							{entry.rounds.map((round, index) => (
								<Box key={`${entry.playedAt}-${round.roundNumber}`}>
									<ListItem disableGutters sx={{ py: 0.75 }}>
										<PProfileMatchHistoryRoundEntry round={round} />
									</ListItem>
									{index < entry.rounds.length - 1 ? <Divider /> : null}
								</Box>
							))}
						</List>
					</Box>

					<Box>
						<List disablePadding>
							{entry.players.map((player, index) => (
								<Box key={`${entry.playedAt}-${player.username}`}>
									<ListItem disableGutters sx={{ py: 1 }}>
										<Stack
											direction="row"
											spacing={1.5}
											alignItems="center"
											sx={{ width: "100%" }}
										>
											<ButtonBase
												onClick={() =>
													navigate(`/users/${player.username}`)
												}
												aria-label={ttrf("HISTORY_OPEN_PROFILE", {
													username: player.username,
												})}
												sx={{
													borderRadius: "999px",
													flexShrink: 0,
												}}
											>
												<Avatar
													src={resolveProfileImage(player.avatar)}
													sx={{ width: 36, height: 36 }}
												>
													{player.username.charAt(0).toUpperCase()}
												</Avatar>
											</ButtonBase>
											<ListItemText
												primary={
													<ButtonBase
														onClick={() =>
															navigate(`/users/${player.username}`)
														}
														sx={{ justifyContent: "flex-start" }}
													>
														<CText size="sm" sx={{ mb: 0 }}>
															{player.username}
														</CText>
													</ButtonBase>
												}
												secondary={ttrf("HISTORY_PLAYER_RANKING", {
													rank: ttrn(player.ranking),
												})}
											/>
										</Stack>
									</ListItem>
									{index < entry.players.length - 1 ? <Divider /> : null}
								</Box>
							))}
						</List>
					</Box>
				</CTabs>
			</AccordionDetails>
		</Accordion>
	);
}

export default PProfileMatchHistoryDrawerCard;
