import CBasePaper from "../../components/surfaces/CBasePaper";
import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const PQA = () => {
	return (
		<PStaticPageShell title="Q_AND_A">
			<CBasePaper sx={{ p: 3 }}>
				<CText size="md" sx={{ mb: 0, lineHeight: 1.8 }}>
					Q&A page
				</CText>
			</CBasePaper>
		</PStaticPageShell>
	);
};

export default PQA;
