import { Stack } from "@mui/material";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";
import CText from "../text/CText";
import CTitle from "../text/CTitle";

export interface CStaticSectionCardProps extends Omit<CBasePaperProps, "children"> {
	title: string;
	paragraphs: string[];
}

function CStaticSectionCard({ title, paragraphs, sx, ...other }: CStaticSectionCardProps) {
	return (
		<CBasePaper
			sx={[
				{
					p: 3,
					height: "100%",
				},
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			{...other}
		>
			<Stack spacing={1.5}>
				<CTitle size="sm">{title}</CTitle>
				{paragraphs.map((paragraph) => (
					<CText key={`${title}-${paragraph}`} size="md">
						{paragraph}
					</CText>
				))}
			</Stack>
		</CBasePaper>
	);
}

export default CStaticSectionCard;
