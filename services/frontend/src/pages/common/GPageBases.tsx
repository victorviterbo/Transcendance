import type { ReactNode } from "react";
import type { GProps } from "../../components/common/GProps";
import { Box, Stack } from "@mui/material";

export interface GPageProps extends GProps {
	children?: ReactNode;
}

function GPageBase({ children }: GPageProps) {
	return (
		<Box sx={{ width: "100%", height: "100dvh" }}>
			<Stack
				sx={{
					height: "100%",
					width: "100%",
					alignItems: "stretch",
				}}
			>
				<Box
					sx={(theme) => ({
						height: "100px",
						backgroundColor: theme.palette.primary.main,
					})}
				></Box>
				<Box sx={{ flex: 1}}>{children}</Box>
				<Box
					sx={(theme) => ({
						height: "50px",
						backgroundColor: theme.palette.primary.main,
					})}></Box>
			</Stack>
		</Box>
	);
}
export default GPageBase;
