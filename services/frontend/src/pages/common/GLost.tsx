import { Box, ThemeProvider } from "@mui/material";
import GBackground from "./GBackground";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CText from "../../components/text/CText";
import appTheme from "../../styles/theme";

function GLost() {
	return (
		<ThemeProvider theme={appTheme}>
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
						CONN_LOST
					</CText>
				</CBasePaper>
			</Box>
		</ThemeProvider>
	);
}

export default GLost;
