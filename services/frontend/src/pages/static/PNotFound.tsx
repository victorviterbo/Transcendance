import CTitlePaper from "../../components/surfaces/CTitlePaper";
import { Container } from "@mui/material";
import GPageBase from "../common/GPageBases";
import CText from "../../components/text/CText";

const PNotFound = () => {
	return (
		<GPageBase>
			<Container sx={{ mt: "5%" }} maxWidth="sm">
				<CTitlePaper title="404" titleType="title" titleSize="lg">
					<CText>NOT_FOUND</CText>
				</CTitlePaper>
			</Container>
		</GPageBase>
	);
};

export default PNotFound;
