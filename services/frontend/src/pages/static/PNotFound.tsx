import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const PNotFound = () => {
	return (
		<PStaticPageShell title="404" titleSize="lg" maxWidth="sm">
			<CText align="center" size="md" sx={{ mb: 0 }}>
				NOT_FOUND
			</CText>
		</PStaticPageShell>
	);
};

export default PNotFound;
