import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

const PUserNotFound = () => {
	return (
		<PStaticPageShell title="404" titleSize="lg" maxWidth="sm">
			<CText align="center" size="md" sx={{ mb: 0 }}>
				USER_NOT_FOUND
			</CText>
		</PStaticPageShell>
	);
};

export default PUserNotFound;
