import type { ReactNode } from "react";
import type { GProps } from "../../components/common/GProps";
import { Box, Stack } from "@mui/material";
import GBackground from "./GBackground";
import CNavbar from "../../components/navigation/CNavbar";
import CFooter from "../../components/navigation/CFooter";

export interface GPageProps extends GProps {
	children?: ReactNode;
}

function GPageBase({ children }: GPageProps) {
	return (
		<>
			<Box sx={{ position: "fixed", inset: 0 }}>
				<GBackground />
				<Stack
					sx={{
						position: "absolute",
						top: 0,
						left: 0,

						height: "100%",
						width: "100%",
						alignItems: "stretch",
					}}
				>
					<CNavbar />
					<Stack sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
						<Box sx={{ flex: 1 }}>{children}</Box>
						<CFooter />
					</Stack>
				</Stack>
			</Box>
		</>
	);
}
export default GPageBase;
