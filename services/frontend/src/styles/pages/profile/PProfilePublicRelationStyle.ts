import type { SxProps, Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";

export type RelationChipTone = "success" | "info" | "warning" | "primary";

const getRelationChipColor = (theme: Theme, tone: RelationChipTone) => {
	if (tone === "success") return theme.palette.success.main;
	if (tone === "info") return theme.palette.info.main;
	if (tone === "warning") return theme.palette.warning.main;
	return theme.palette.primary.main;
};

export const getRelationChipStyle =
	(tone: RelationChipTone): SxProps<Theme> =>
	(theme) => {
		const color = getRelationChipColor(theme, tone);

		return {
			height: 36,
			borderRadius: 1.5,
			border: `1px solid ${alpha(color, 0.44)}`,
			backgroundColor: alpha(color, 0.16),
			color,
			fontWeight: 800,
			boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.18)}`,
			"& .MuiChip-label": {
				px: 1.25,
			},
			"& .MuiChip-icon": {
				color,
				fontSize: 19,
				ml: 1,
			},
		};
	};
