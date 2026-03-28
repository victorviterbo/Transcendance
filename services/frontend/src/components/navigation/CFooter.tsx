import { Box, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import CText from "../text/CText";
import { appPositions } from "../../styles/theme";

interface CFooterLinkProps {
	to: string;
	label: string;
}

function CFooterLink({ to, label }: CFooterLinkProps) {
	return (
		<Box
			component={RouterLink}
			to={to}
			sx={{
				color: "inherit",
				textDecoration: "none",
				opacity: 0.84,
				transition: "opacity 150ms ease, color 150ms ease",
				"&:hover": {
					opacity: 1,
					color: "primary.main",
				},
			}}
		>
			<CText size="md" span={true} sx={{ mb: 0 }}>
				{label}
			</CText>
		</Box>
	);
}

function CFooter() {
	return (
		<Box
			component="footer"
			sx={{
				flexShrink: 0,
				mt: "auto",
				px: { xs: 2.5, sm: 4 },
				py: { xs: 2, sm: 2.5 },
				minHeight: appPositions.sizes.footer,
				borderTop: "1px solid rgba(255, 255, 255, 0.14)",
				backgroundColor: "rgba(7, 11, 24, 0.76)",
				backdropFilter: "blur(10px)",
			}}
		>
			<Stack
				direction="row"
				spacing={{ xs: 2.5, sm: 3.5 }}
				useFlexGap={true}
				flexWrap="wrap"
				alignItems="center"
				justifyContent="center"
			>
				<CFooterLink to="/contact" label="CONTACT" />
				<CFooterLink to="/qa" label="Q_AND_A" />
				<CFooterLink to="/terms-of-service" label="TERMS_OF_SERVICE" />
				<CFooterLink to="/privacy-policy" label="PRIVACY_POLICY" />
			</Stack>
		</Box>
	);
}

export default CFooter;
