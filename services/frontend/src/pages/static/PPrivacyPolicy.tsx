import CBasePaper from "../../components/surfaces/CBasePaper";
import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const PPrivacyPolicy = () => {
	return (
		<PStaticPageShell title="PRIVACY_POLICY">
			<CBasePaper sx={{ p: 3 }}>
				<CText size="md" sx={{ mb: 0, lineHeight: 1.8 }}>
					Privacy policy page
				</CText>
			</CBasePaper>
		</PStaticPageShell>
	);
};

export default PPrivacyPolicy;
