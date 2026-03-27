import { Box, Stack } from "@mui/material";
import CTitle from "../text/CTitle";

interface CLevelProgressProps {
	level: number;
	progressPercent: number;
	title?: string;
}

function CLevelProgress({ level, progressPercent, title = "Rookie" }: CLevelProgressProps) {
	const safeLevel = Math.max(0, Math.floor(level));
	const safeProgressPercent = Math.min(100, Math.max(0, Math.round(progressPercent)));
	const displayTitle = title.trim();

	return (
		<Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%" }}>
			<Stack
				alignItems="center"
				justifyContent="center"
				sx={(theme) => ({
					minWidth: { xs: 58, sm: 66 },
					px: { xs: 0.75, sm: 1 },
					py: 0.55,
					borderRadius: "18px",
					border: "3px solid #000",
					boxShadow: "0 3px 0 #000",
					background: `linear-gradient(180deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
				})}
			>
				<Box
					sx={(theme) => ({
						fontFamily: "Knewave, " + theme.typography.fontFamily,
						fontSize: { xs: "1.05rem", sm: "1.2rem" },
						lineHeight: 1,
						color: theme.palette.text.primary,
						textShadow: "0 2px 0 rgba(0, 0, 0, 0.45)",
					})}
				>
					{safeLevel}
				</Box>
				<Box
					sx={(theme) => ({
						fontFamily: "DynaPuff, " + theme.typography.fontFamily,
						fontSize: "0.5rem",
						fontWeight: 700,
						letterSpacing: "0.14em",
						textTransform: "uppercase",
						color: theme.palette.text.primary,
						opacity: 0.9,
					})}
				>
					LVL
				</Box>
			</Stack>

			<Stack
				spacing={0.45}
				justifyContent="center"
				sx={{
					minWidth: 0,
					width: "100%",
					maxWidth: { xs: "100%", sm: 260, md: 300 },
				}}
			>
				<CTitle
					size="sm"
					align="center"
					sx={{
						mb: 0,
						fontSize: { xs: "0.85rem", sm: "0.95rem" },
						lineHeight: 1.1,
					}}
				>
					{displayTitle}
				</CTitle>

				<Box
					role="progressbar"
					aria-label={`${displayTitle} level progress`}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={safeProgressPercent}
					sx={{
						width: "100%",
						position: "relative",
						height: 22,
						overflow: "hidden",
						borderRadius: "999px",
						border: "3px solid #000",
						boxShadow: "0 4px 0 #000",
						background: "linear-gradient(180deg, #242424 0%, #3c3c3c 100%)",
						"&::before": {
							content: '""',
							position: "absolute",
							inset: 0,
							backgroundImage:
								"linear-gradient(135deg, rgba(255, 255, 255, 0.12) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.12) 75%, transparent 75%, transparent 100%)",
							backgroundSize: "28px 28px",
							opacity: 0.45,
						},
						"&::after": {
							content: '""',
							position: "absolute",
							inset: "2px 5px auto 5px",
							height: 6,
							borderRadius: "999px",
							background: "rgba(255, 255, 255, 0.22)",
							pointerEvents: "none",
						},
					}}
				>
					<Box
						sx={(theme) => ({
							position: "absolute",
							inset: 0,
							width: `${safeProgressPercent}%`,
							borderRadius: "999px",
							background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 42%, ${theme.palette.primary.main} 100%)`,
							transition: "width 240ms ease-out",
							"&::after": {
								content: '""',
								position: "absolute",
								inset: "2px auto auto 5px",
								right: 5,
								height: 6,
								borderRadius: "999px",
								background: "rgba(255, 255, 255, 0.3)",
							},
						})}
					/>
					<Box
						sx={(theme) => ({
							position: "relative",
							zIndex: 1,
							display: "flex",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
							fontFamily: "DynaPuff, " + theme.typography.fontFamily,
							fontSize: "0.78rem",
							fontWeight: 700,
							letterSpacing: "0.06em",
							color: theme.palette.text.primary,
							textShadow: "0 2px 0 rgba(0, 0, 0, 0.55)",
						})}
					>
						{safeProgressPercent}%
					</Box>
				</Box>
			</Stack>
		</Stack>
	);
}

export default CLevelProgress;
