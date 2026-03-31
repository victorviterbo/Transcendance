import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Stack } from "@mui/material";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import PStaticPageShell from "./PStaticPageShell";

const faqItems = [
	{
		question: "QA_PROFILE_PICTURE_QUESTION",
		answer: "QA_PROFILE_PICTURE_ANSWER",
	},
	{
		question: "QA_ACCOUNT_INFO_QUESTION",
		answer: "QA_ACCOUNT_INFO_ANSWER",
	},
	{
		question: "QA_PASSWORD_QUESTION",
		answer: "QA_PASSWORD_ANSWER",
	},
	{
		question: "QA_DELETE_ACCOUNT_QUESTION",
		answer: "QA_DELETE_ACCOUNT_ANSWER",
	},
	{
		question: "QA_LEVELS_QUESTION",
		answer: "QA_LEVELS_ANSWER",
	},
	{
		question: "QA_CONTACT_QUESTION",
		answer: "QA_CONTACT_ANSWER",
	},
	{
		question: "QA_MATCH_RULES_QUESTION",
		answer: "QA_MATCH_RULES_ANSWER",
	},
	{
		question: "QA_RANKING_QUESTION",
		answer: "QA_RANKING_ANSWER",
	},
];

const PQA = () => {
	return (
		<PStaticPageShell title="Q_AND_A" maxWidth="md">
			<CText size="md" align="center">
				QA_INTRO
			</CText>
			<Stack spacing={2}>
				{faqItems.map((item, index) => (
					<Accordion key={item.question} defaultExpanded={index === 0} disableGutters>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<CTitle size="sm">{item.question}</CTitle>
						</AccordionSummary>
						<AccordionDetails>
							<CText size="md">{item.answer}</CText>
						</AccordionDetails>
					</Accordion>
				))}
			</Stack>
		</PStaticPageShell>
	);
};

export default PQA;
