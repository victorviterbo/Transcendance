import { Box } from "@mui/material";
import GBackground from "./GBackground";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CText from "../../components/text/CText";

function GLoading() {
	return (
		<Box sx={{ position: "fixed", inset: 0 }}>
			<GBackground />
			<CBasePaper
				sx={{
					position: "relative",
					maxWidth: "500px",
					maxHeight: "150px",
					mt: "50px",
					mx: "auto",
				}}
			>
				<CText align="center" sx={{ my: "auto" }}>
					LOADING
				</CText>
			</CBasePaper>
		</Box>
	);
}

export default GLoading;
