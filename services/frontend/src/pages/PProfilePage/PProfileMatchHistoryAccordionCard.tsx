import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Chip,
	Divider,
	List,
	ListItem,
	ListItemText,
	Stack,
} from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { resolveProfileImage } from "../../api/profile";
import CAvatar from "../../components/images/CAvatar";
import CUserProfileLink from "../../components/navigation/CUserProfileLink";
import CTabs from "../../components/navigation/CTabs";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import type { IHistoryEntry } from "../../types/stats";
import PProfileMatchHistoryRoundEntry from "./PProfileMatchHistoryRoundEntry";
import {
	PProfileMatchHistoryStyle,
	type IProfileMatchHistoryStyle,
} from "../../styles/pages/profile/PProfileMatchHistoryStyle";
import { appColors } from "../../styles/theme";
import { useLang } from "../../components/contexts/CLanguageProvider";

interface PProfileMatchHistoryAccordionCardProps {
	entry: IHistoryEntry;
}

function PProfileMatchHistoryAccordionCard({ entry }: PProfileMatchHistoryAccordionCardProps) {
	const style: IProfileMatchHistoryStyle = useMemo(() => {
		return PProfileMatchHistoryStyle();
	}, []);

	const { ttr, ttrd, ttrf, ttrn } = useLang();

	const playedAtLabel = useMemo(() => {
		return ttrd(entry.playedAt, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}, [entry.playedAt, ttrd]);

	const rankingLabel = useMemo(() => {
		return ttrf("HISTORY_RANKING", {
			rank: ttrn(entry.ranking),
			players: ttrn(entry.players.length),
		});
	}, [entry.players.length, entry.ranking, ttrf, ttrn]);

	const scoreLabel = useMemo(() => {
		return ttrf("HISTORY_SCORE", {
			score: ttrn(entry.xpEarned),
		});
	}, [entry.xpEarned, ttrf, ttrn]);

	const tagChips = useMemo((): ReactNode[] => {
		return entry.tags.map((tag) => <Chip key={tag} size="small" label={ttr(tag)} />);
	}, [entry.tags, ttr]);

	const roundList = useMemo((): ReactNode[] => {
		return entry.rounds.map((round, index) => (
			<Box key={`${entry.playedAt}-${round.roundNumber}`}>
				<ListItem disableGutters sx={{ py: 0.75 }}>
					<PProfileMatchHistoryRoundEntry round={round} />
				</ListItem>
				{index < entry.rounds.length - 1 ? <Divider sx={style.divider} /> : null}
			</Box>
		));
	}, [entry.playedAt, entry.rounds, style.divider]);

	const playerList = useMemo((): ReactNode[] => {
		return entry.players.map((player, index) => (
			<Box key={`${entry.playedAt}-${player.username}`}>
				<ListItem disableGutters sx={{ py: 1 }}>
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
						<CAvatar
							profileUsername={player.username}
							profileAriaLabel={ttrf("HISTORY_OPEN_PROFILE", {
								username: player.username,
							})}
							src={resolveProfileImage(player.avatar)}
							sx={{ width: 36, height: 36 }}
						>
							{player.username.charAt(0).toUpperCase()}
						</CAvatar>
						<ListItemText
							primary={
								<CUserProfileLink username={player.username}>
									<CText
										size="sm"
										sx={{ mb: 0 }}
										noTr={true}
										color={
											player.ranking <= 3
												? appColors.secondary[0]
												: appColors.primary[0]
										}
									>
										{player.username}
									</CText>
								</CUserProfileLink>
							}
							secondary={
								<CText size="xs" color={appColors.greys[3]}>
									{ttrf("HISTORY_PLAYER_RANKING", {
										rank: ttrn(player.ranking),
									})}
								</CText>
							}
						/>
					</Stack>
				</ListItem>
				{index < entry.players.length - 1 ? <Divider sx={style.divider} /> : null}
			</Box>
		));
	}, [entry.playedAt, entry.players, style.divider, ttrn, ttrf]);

	return (
		<Accordion disableGutters sx={style.card}>
			<AccordionSummary
				expandIcon={<ExpandMoreIcon />}
				sx={style.summary}
				aria-controls={`match-history-${entry.playedAt}`}
				id={`match-history-${entry.playedAt}-header`}
			>
				<Stack spacing={1.5} sx={style.summaryContent}>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={1}
						sx={style.summaryHeader}
					>
						<Stack spacing={0.35} sx={style.summaryTitleGroup}>
							<CTitle noTr={true} size="sm" sx={style.summaryTitle}>
								{entry.roomTitle}
							</CTitle>
							<CText size="sm" sx={{ mb: 0 }}>
								{playedAtLabel}
							</CText>
						</Stack>
						<Stack
							direction="row"
							spacing={1.5}
							useFlexGap
							flexWrap="wrap"
							sx={style.summaryMeta}
						>
							<CText size="sm" sx={{ mb: 0 }}>
								{scoreLabel}
							</CText>
							<CText size="sm" sx={{ mb: 0 }}>
								{rankingLabel}
							</CText>
						</Stack>
					</Stack>
					<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
						{tagChips}
					</Stack>
				</Stack>
			</AccordionSummary>

			<AccordionDetails sx={{ px: 2, pb: 2 }}>
				<CTabs tabs={["HISTORY_ROUNDS", "HISTORY_PLAYERS"]}>
					<Box>
						<List disablePadding>{roundList}</List>
					</Box>

					<Box>
						<List disablePadding>{playerList}</List>
					</Box>
				</CTabs>
			</AccordionDetails>
		</Accordion>
	);
}

export default PProfileMatchHistoryAccordionCard;
