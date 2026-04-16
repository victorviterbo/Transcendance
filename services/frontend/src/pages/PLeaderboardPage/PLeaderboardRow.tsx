import { alpha, Box, Stack } from "@mui/material";
import { resolveProfileImage } from "../../api/profile";
import type { ILeaderboardEntry } from "../../types/stats";
import CAvatar from "../../components/images/CAvatar";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";

interface PLeaderboardRowProps {
	entry: ILeaderboardEntry;
}

const getScaledRadius = (borderRadius: number | string, divisor = 1) =>
	typeof borderRadius === "number" ? `${borderRadius / divisor}px` : borderRadius;

function PLeaderboardRow({ entry }: PLeaderboardRowProps) {
	const isTopThree = entry.ranking <= 3;

	return (
		<Stack
			direction="row"
			spacing={2}
			alignItems="center"
			sx={(theme) => ({
				px: { xs: 1.5, md: 2 },
				py: { xs: 1.5, md: 1.75 },
				borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
				borderLeft: `4px solid ${
					entry.isCurrentUser
						? theme.palette.primary.main
						: isTopThree
							? theme.palette.secondary.main
							: "transparent"
				}`,
				background: entry.isCurrentUser
					? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.primary.dark, 0.04)} 100%)`
					: "transparent",
			})}
			data-testid="leaderboard-row"
		>
			<Box
				sx={(theme) => ({
					minWidth: { xs: 44, sm: 52 },
					height: { xs: 44, sm: 52 },
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
					background: isTopThree
						? `linear-gradient(180deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`
						: alpha(theme.palette.primary.main, 0.08),
					boxShadow: `inset 0 0 0 1px ${
						isTopThree
							? alpha(theme.palette.secondary.main, 0.55)
							: alpha(theme.palette.primary.main, 0.16)
					}`,
				})}
			>
				<CText
					size="lg"
					weight={700}
					sx={{
						mb: 0,
						color: "text.primary",
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{entry.ranking}
				</CText>
			</Box>

			<CAvatar
				src={resolveProfileImage(entry.avatar)}
				sx={(theme) => ({
					width: { xs: 48, sm: 56 },
					height: { xs: 48, sm: 56 },
					bgcolor: isTopThree ? "secondary.main" : "primary.dark",
					fontWeight: 700,
					border: `2px solid ${
						entry.isCurrentUser
							? theme.palette.primary.main
							: isTopThree
								? theme.palette.secondary.light
								: alpha(theme.palette.primary.main, 0.16)
					}`,
				})}
			>
				{entry.username.charAt(0).toUpperCase()}
			</CAvatar>

			<Stack sx={{ flex: 1, minWidth: 0 }}>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={1}
					alignItems={{ xs: "flex-start", sm: "center" }}
				>
					<CTitle size="sm" sx={{ mb: 0 }}>
						{entry.username}
					</CTitle>
				</Stack>
				<Box
					sx={(theme) => ({
						alignSelf: "flex-start",
						mt: 0.6,
						px: 1.25,
						py: 0.6,
						borderRadius: getScaledRadius(theme.shape.borderRadius, 2.25),
						backgroundColor: alpha(theme.palette.secondary.main, 0.12),
						border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
					})}
				>
					<CText size="xs" sx={{ color: "text.primary", mb: 0 }}>
						{entry.badges}
					</CText>
				</Box>
			</Stack>

			<Stack alignItems="flex-end" spacing={0.45} sx={{ minWidth: { xs: 80, sm: 108 } }}>
				<CText
					size="xs"
					sx={(theme) => ({
						mb: 0,
						color: alpha(theme.palette.text.primary, 0.72),
						letterSpacing: "0.08em",
						textTransform: "uppercase",
					})}
				>
					LEADERBOARD_POINTS
				</CText>
				<Box
					sx={(theme) => ({
						minWidth: { xs: 74, sm: 88 },
						px: 1.25,
						py: 0.75,
						borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
						backgroundColor: alpha(
							entry.isCurrentUser
								? theme.palette.primary.main
								: theme.palette.primary.dark,
							entry.isCurrentUser ? 0.18 : 0.22,
						),
						boxShadow: `inset 0 0 0 1px ${
							entry.isCurrentUser
								? alpha(theme.palette.primary.main, 0.32)
								: alpha(theme.palette.primary.light, 0.2)
						}`,
					})}
				>
					<CTitle
						size="sm"
						align="right"
						sx={{
							mb: 0,
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{entry.xp}
					</CTitle>
				</Box>
			</Stack>
		</Stack>
	);
}

export default PLeaderboardRow;
