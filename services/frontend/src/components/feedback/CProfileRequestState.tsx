import { Container, type ContainerOwnProps } from "@mui/material";
import CBasePaper from "../surfaces/CBasePaper";
import CText from "../text/CText";

export interface CProfileRequestStateProps {
	status: "loading" | "error" | "notFound";
	error?: string | null;
	maxWidth?: ContainerOwnProps["maxWidth"];
}

function CProfileRequestState({ status, error, maxWidth = "sm" }: CProfileRequestStateProps) {
	return (
		<Container maxWidth={maxWidth} sx={{ py: { xs: 4, md: 6 } }}>
			<CBasePaper sx={{ p: 3 }}>
				<CText
					align="center"
					size="md"
					color={status === "error" ? "error.main" : undefined}
					sx={{ mb: 0 }}
				>
					{status === "error"
						? (error ?? "PROFILE_LOAD_FAILED")
						: status === "notFound"
							? "USER_NOT_FOUND"
							: "PROFILE_LOADING"}
				</CText>
			</CBasePaper>
		</Container>
	);
}

export default CProfileRequestState;
