import type { ButtonProps, SxProps, Theme } from "@mui/material";
import { appColors, appSharedStyle } from "../../theme";

export type RelationChipTone = "success" | "info" | "loading";
type RelationButtonVisualProps = Pick<ButtonProps, "variant"> & {
	sx: SxProps<Theme>;
};

export interface IProfilePublicRelationStyle {
	relationChip: (tone: RelationChipTone) => SxProps<Theme>;
	dangerButton: RelationButtonVisualProps;
	successButton: RelationButtonVisualProps;
}

const relationChipColors: Record<RelationChipTone, { background: string; text: string }> = {
	success: { background: appColors.validate[0], text: appColors.text.dark },
	info: { background: appColors.primary[1], text: appColors.text.light },
	loading: { background: appColors.greys[3], text: appColors.text.dark },
};

export const PProfilePublicRelationStyle = (): IProfilePublicRelationStyle => ({
	relationChip: (tone: RelationChipTone): SxProps<Theme> => {
		const colors = relationChipColors[tone];

		return {
			height: 36,
			borderRadius: appSharedStyle.smallGameRadius,
			border: `2px solid ${colors.background}`,
			backgroundColor: colors.background,
			color: colors.text,
			fontWeight: 800,
			boxShadow: `0px 3px 0px 0px ${appColors.greys[9]}`,
			"& .MuiChip-icon": {
				color: colors.text,
			},
		};
	},
	dangerButton: {
		variant: "contained",
		sx: {
			backgroundColor: appColors.cancel[0],
			color: appColors.text.light,
			"&:hover": {
				backgroundColor: appColors.cancel[1],
				color: appColors.text.light,
			},
		},
	},
	successButton: {
		variant: "contained",
		sx: {
			backgroundColor: appColors.validate[1],
			color: appColors.text.light,
			"&:hover": {
				backgroundColor: appColors.validate[0],
				color: appColors.text.dark,
			},
		},
	},
});
