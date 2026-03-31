import { Box } from "@mui/material";
import CStaticSectionCard from "../../components/surfaces/CStaticSectionCard";
import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const termsSections = [
	{
		title: "TERMS_ACCOUNTS_TITLE",
		paragraphs: ["TERMS_ACCOUNTS_BODY_1", "TERMS_ACCOUNTS_BODY_2"],
	},
	{
		title: "TERMS_CONDUCT_TITLE",
		paragraphs: ["TERMS_CONDUCT_BODY_1", "TERMS_CONDUCT_BODY_2"],
	},
	{
		title: "TERMS_SERVICE_TITLE",
		paragraphs: ["TERMS_SERVICE_BODY_1", "TERMS_SERVICE_BODY_2"],
	},
	{
		title: "TERMS_CONTENT_TITLE",
		paragraphs: ["TERMS_CONTENT_BODY_1", "TERMS_CONTENT_BODY_2"],
	},
	{
		title: "TERMS_ENFORCEMENT_TITLE",
		paragraphs: ["TERMS_ENFORCEMENT_BODY_1", "TERMS_ENFORCEMENT_BODY_2"],
	},
	{
		title: "TERMS_CHANGES_TITLE",
		paragraphs: ["TERMS_CHANGES_BODY_1", "TERMS_CHANGES_BODY_2"],
	},
];

const PTermsOfService = () => {
	return (
		<PStaticPageShell title="TERMS_OF_SERVICE">
			<CText size="md" align="center">
				TERMS_INTRO
			</CText>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						md: "repeat(2, minmax(0, 1fr))",
					},
					gap: 3,
				}}
			>
				{termsSections.map((section) => (
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

export default PTermsOfService;
