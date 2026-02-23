import type { ReactNode } from "react";
import type { GProps } from "../../components/common/GProps";
import { Box, Stack } from "@mui/material";
import GBackground from "./GBackground";

export interface GPageProps extends GProps {
	children?: ReactNode;
}

function GPageBase({ children }: GPageProps) {
	return (
		<Box sx={{ position: "fixed", width: "100%", height: "100%" }}>
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
				<Box
					sx={{
						height: "75px",
						bgcolor: "primary.main",
					}}
				></Box>
				<Stack sx={{ flex: 1, overflow: "auto" }}>
					<Box sx={{ flex: 1 }}>{children}</Box>
					<Box
						sx={{
							flexShrink: 0,
							height: "50px",
							bgcolor: "primary.main",
						}}
					></Box>
				</Stack>
			</Stack>
		</Box>
	);
}
export default GPageBase;
