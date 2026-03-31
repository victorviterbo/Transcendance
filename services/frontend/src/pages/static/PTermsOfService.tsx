import CBasePaper from "../../components/surfaces/CBasePaper";
import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const PTermsOfService = () => {
	return (
		<PStaticPageShell title="TERMS_OF_SERVICE">
			<CBasePaper sx={{ p: 3 }}>
				<CText size="md" sx={{ mb: 0, lineHeight: 1.8 }}>
					Terms of service page
				</CText>
			</CBasePaper>
		</PStaticPageShell>
	);
};

export default PTermsOfService;
