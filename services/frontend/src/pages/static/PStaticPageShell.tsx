import type { ReactNode } from "react";
import { Container, Stack, type ContainerOwnProps } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import type { TSize } from "../../types/string";

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
		<Container maxWidth={maxWidth} sx={{ py: { xs: 4, md: 6 } }}>
			<CTitlePaper title={title} titleType="title" titleSize={titleSize}>
				<Stack spacing={3}>{children}</Stack>
			</CTitlePaper>
		</Container>
	);
}

export default PStaticPageShell;
