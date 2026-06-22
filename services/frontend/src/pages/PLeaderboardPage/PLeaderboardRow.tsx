import { Box, Stack } from "@mui/material";
import { useMemo } from "react";
import { resolveProfileImage } from "../../api/profile";
import type { ILeaderboardEntry } from "../../types/stats";
import CAvatar from "../../components/images/CAvatar";
import CUserProfileLink from "../../components/navigation/CUserProfileLink";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import {
	PLeaderboardStyle,
	type ILeaderboardStyle,
} from "../../styles/pages/leaderboard/PLeaderboardStyle";

interface PLeaderboardRowProps {
	entry: ILeaderboardEntry;
}

function PLeaderboardRow({ entry }: PLeaderboardRowProps) {
	const style: ILeaderboardStyle = useMemo(() => {
		return PLeaderboardStyle();
	}, []);
	const isTopThree = entry.ranking <= 3;

	return (
		<Stack
			direction="row"
			spacing={2}
			alignItems="center"
			sx={style.row(entry.isCurrentUser, isTopThree)}
			data-testid="leaderboard-row"
		>
			<Box sx={style.ranking(isTopThree)}>
				<CText size="lg" weight={700} sx={style.rankingText}>
					{entry.ranking}
				</CText>
			</Box>

			<CAvatar
				profileUsername={entry.username}
				src={resolveProfileImage(entry.avatar)}
				sx={style.avatar(entry.isCurrentUser, isTopThree)}
			>
				{entry.username.charAt(0).toUpperCase()}
			</CAvatar>

			<Stack sx={{ flex: 1, minWidth: 0 }}>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={1}
					alignItems={{ xs: "flex-start", sm: "center" }}
				>
					<CUserProfileLink username={entry.username}>
						<CTitle size="sm" sx={{ mb: 0 }}>
							{entry.username}
						</CTitle>
					</CUserProfileLink>
				</Stack>
				<Box sx={style.badge(entry.isCurrentUser, isTopThree)}>
					<CText size="xs" sx={style.badgeText}>
						{entry.badges}
					</CText>
				</Box>
			</Stack>

			<Stack alignItems="flex-end" spacing={0.45} sx={{ minWidth: { xs: 80, sm: 108 } }}>
				<CText size="xs" sx={style.pointsLabel(entry.isCurrentUser, isTopThree)}>
					LEADERBOARD_POINTS
				</CText>
				<Box sx={style.pointsValue(entry.isCurrentUser, isTopThree)}>
					<CTitle size="sm" align="right" sx={style.pointsText}>
						{entry.xp}
					</CTitle>
				</Box>
			</Stack>
		</Stack>
	);
}

export default PLeaderboardRow;
