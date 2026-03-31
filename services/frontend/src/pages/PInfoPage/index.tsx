import { Container, Stack } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CText from "../../components/text/CText";
import GPageBase from "../common/GPageBases";

interface PInfoPageProps {
	title: string;
	paragraphs: string[];
}

function PInfoPage({ title, paragraphs }: PInfoPageProps) {
	return (
		<GPageBase>
			<Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
				<CTitlePaper title={title} titleType="title" titleSize="md">
					<Stack spacing={2.5}>
						{paragraphs.map((paragraph, index) => (
							<CText
								key={`${title}-${index}`}
								size="md"
								sx={{
									mb: 0,
									lineHeight: 1.8,
									opacity: 0.92,
								}}
							>
								{paragraph}
							</CText>
						))}
					</Stack>
				</CTitlePaper>
			</Container>
		</GPageBase>
	);
}

export default PInfoPage;
