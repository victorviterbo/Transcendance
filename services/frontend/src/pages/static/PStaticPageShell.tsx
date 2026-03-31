import type { ReactNode } from "react";
import { Container, Stack, type ContainerOwnProps } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import type { TSize } from "../../types/string";
import GPageBase from "../common/GPageBases";

interface PStaticPageShellProps {
	title: string;
	titleSize?: TSize;
	maxWidth?: ContainerOwnProps["maxWidth"];
	children?: ReactNode;
}

function PStaticPageShell({
	title,
	titleSize = "md",
	maxWidth = "lg",
	children,
}: PStaticPageShellProps) {
	return (
		<GPageBase>
			<Container maxWidth={maxWidth} sx={{ py: { xs: 4, md: 6 } }}>
				<CTitlePaper title={title} titleType="title" titleSize={titleSize}>
					<Stack spacing={3}>{children}</Stack>
				</CTitlePaper>
			</Container>
		</GPageBase>
	);
}

export default PStaticPageShell;
