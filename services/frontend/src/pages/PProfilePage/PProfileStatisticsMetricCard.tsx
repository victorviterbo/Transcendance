import { alpha, Box, Stack } from "@mui/material";
import type { ReactNode } from "react";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import { getScaledRadius } from "../../utils/styles";

type PProfileStatisticsMetricCardVariant = "stacked" | "inline";
type PProfileStatisticsMetricCardTone = "primary" | "secondary";

interface PProfileStatisticsMetricCardProps {
	icon?: ReactNode;
	label: string;
	value: string;
	variant?: PProfileStatisticsMetricCardVariant;
	tone?: PProfileStatisticsMetricCardTone;
}

function PProfileStatisticsMetricCard({
	icon,
	label,
	value,
	variant = "stacked",
	tone = "primary",
}: PProfileStatisticsMetricCardProps) {
	const isInline = variant === "inline";

	return (
		<Box
			sx={(theme) => ({
				height: "100%",
				p: isInline ? 1.5 : 2,
				borderRadius: getScaledRadius(theme.shape.borderRadius, isInline ? 2.5 : 2),
				backgroundColor:
					tone === "secondary"
						? alpha(theme.palette.secondary.main, isInline ? 0.12 : 0.08)
						: alpha(theme.palette.primary.main, 0.08),
				border: `1px solid ${
					tone === "secondary"
						? alpha(theme.palette.secondary.main, isInline ? 0.18 : 0.14)
						: alpha(theme.palette.primary.main, 0.14)
				}`,
			})}
		>
			<Stack
				direction={isInline ? "row" : "column"}
				spacing={isInline ? 1.5 : 1.1}
				alignItems="center"
				justifyContent={isInline ? "space-between" : undefined}
				textAlign={isInline ? "left" : "center"}
			>
				{icon ? (
					<Box
						sx={(theme) => ({
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 52,
							height: 52,
							borderRadius: getScaledRadius(theme.shape.borderRadius, 2.5),
							backgroundColor: alpha(theme.palette.secondary.main, 0.14),
							color: theme.palette.secondary.main,
						})}
					>
						{icon}
					</Box>
				) : null}
				{isInline ? (
					<>
						<CText size="sm" sx={{ mb: 0 }}>
							{label}
						</CText>
						<CText size="sm" weight={700} sx={{ mb: 0 }}>
							{value}
						</CText>
					</>
				) : (
					<>
						<CTitle size="sm" sx={{ mb: 0 }}>
							{value}
						</CTitle>
						<CText
							size="xs"
							align="center"
							sx={(theme) => ({
								mb: 0,
								color: alpha(theme.palette.text.primary, 0.7),
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							})}
						>
							{label}
						</CText>
					</>
				)}
			</Stack>
		</Box>
	);
}

export default PProfileStatisticsMetricCard;
