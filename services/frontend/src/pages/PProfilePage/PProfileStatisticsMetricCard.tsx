import { Box, Stack } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import {
	PProfileStatisticsStyle,
	type IProfileStatisticsStyle,
} from "../../styles/pages/profile/PProfileStatisticsStyle";

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
	const style: IProfileStatisticsStyle = useMemo(() => {
		return PProfileStatisticsStyle();
	}, []);

	return (
		<Box sx={style.metricCard(isInline, tone)}>
			<Stack
				direction={isInline ? "row" : "column"}
				spacing={isInline ? 1.5 : 1.1}
				alignItems="center"
				justifyContent={isInline ? "space-between" : undefined}
				textAlign={isInline ? "left" : "center"}
			>
				{icon ? <Box sx={style.metricIcon}>{icon}</Box> : null}
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
						<CText size="xs" align="center" sx={style.metricLabel}>
							{label}
						</CText>
					</>
				)}
			</Stack>
		</Box>
	);
}

export default PProfileStatisticsMetricCard;
