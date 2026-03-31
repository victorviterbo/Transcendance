import { Box } from "@mui/material";
import CStaticSectionCard from "../../components/surfaces/CStaticSectionCard";
import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const privacySections = [
	{
		title: "PRIVACY_DATA_TITLE",
		paragraphs: ["PRIVACY_DATA_BODY_1", "PRIVACY_DATA_BODY_2"],
	},
	{
		title: "PRIVACY_USAGE_TITLE",
		paragraphs: ["PRIVACY_USAGE_BODY_1", "PRIVACY_USAGE_BODY_2"],
	},
	{
		title: "PRIVACY_SHARING_TITLE",
		paragraphs: ["PRIVACY_SHARING_BODY_1", "PRIVACY_SHARING_BODY_2"],
	},
	{
		title: "PRIVACY_RETENTION_TITLE",
		paragraphs: ["PRIVACY_RETENTION_BODY_1", "PRIVACY_RETENTION_BODY_2"],
	},
	{
		title: "PRIVACY_RIGHTS_TITLE",
		paragraphs: ["PRIVACY_RIGHTS_BODY_1", "PRIVACY_RIGHTS_BODY_2"],
	},
];

const PPrivacyPolicy = () => {
	return (
		<PStaticPageShell title="PRIVACY_POLICY">
			<CText size="md" align="center">
				PRIVACY_INTRO
			</CText>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						md: "repeat(2, minmax(0, 1fr))",
					},
					gap: 3,
				}}
			>
				{privacySections.map((section) => (
					<CStaticSectionCard
						key={section.title}
						title={section.title}
						paragraphs={section.paragraphs}
					/>
				))}
			</Box>
		</PStaticPageShell>
	);
};

export default PPrivacyPolicy;
