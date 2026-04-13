import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const PPageNotFound = () => {
	return (
		<PStaticPageShell title="404" titleSize="lg" maxWidth="sm">
			<CText align="center" size="md" sx={{ mb: 0 }}>
				PAGE_NOT_FOUND
			</CText>
		</PStaticPageShell>
	);
};

export default PPageNotFound;
