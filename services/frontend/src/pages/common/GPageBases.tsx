import type { ReactNode } from "react";
import type { GProps } from "../../components/common/GProps";
import { Box, Stack } from "@mui/material";
import GBackground from "./GBackground";
import CNavbar from "../../components/navigation/CNavbar";
import { appPositions } from "../../styles/theme";

export interface GPageProps extends GProps {
	children?: ReactNode;
}

function GPageBase({ children }: GPageProps) {
	return (
		<Box sx={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}>
			<GBackground />
			<Stack
				sx={{
					position: "absolute",
					inset: 0,
					height: "100%",
					width: "100%",
					alignItems: "stretch",
				}}
			>
				<CNavbar />
				<Stack sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
					<Box sx={{ flex: 1 }}>{children}</Box>
					<Box
						sx={{
							flexShrink: 0,
							height:
								appPositions.sizes.footer +
								(appPositions.sizes.footer == "string" ? "" : "px"),
							background:
								"linear-gradient(90deg, rgba(255, 216, 74, 0.78) 0%, rgba(73, 238, 255, 0.7) 48%, rgba(255, 88, 188, 0.82) 100%)",
							borderTop: "3px solid rgba(255, 255, 255, 0.58)",
							boxShadow: "0 -8px 22px rgba(17, 10, 53, 0.18)",
							opacity: 0.88,
						}}
					></Box>
				</Stack>
			</Stack>
		</Box>
	);
}
export default GPageBase;
