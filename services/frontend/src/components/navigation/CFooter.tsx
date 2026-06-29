import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import CText from "../text/CText";
import { appPositions } from "../../styles/theme";
import type { TSize } from "../../types/string";

interface CFooterLinkProps {
	to: string;
	label: string;
	size: TSize
}

function CFooterLink({ to, label, size}: CFooterLinkProps) {
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
			<CText size={size} span={true} sx={{ mb: 0 }}>
				{label}
			</CText>
		</Box>
	);
}

interface CFooterProps {
	hide: boolean;
}

function CFooter({ hide }: CFooterProps) {

	const theme = useTheme();
	const isTiny = useMediaQuery(theme.breakpoints.down("tn"))
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"))
	
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
				display: hide ? "none" : "block",
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
				<CFooterLink size={isTiny ? "xs" : (isSmall ? "sm" : "md")} to="/contact" label="CONTACT" />
				<CFooterLink size={isTiny ? "xs" : (isSmall ? "sm" : "md")} to="/qa" label="Q_AND_A" />
				<CFooterLink size={isTiny ? "xs" : (isSmall ? "sm" : "md")} to="/terms-of-service" label="TERMS_OF_SERVICE" />
				<CFooterLink size={isTiny ? "xs" : (isSmall ? "sm" : "md")} to="/privacy-policy" label="PRIVACY_POLICY" />
			</Stack>
		</Box>
	);
}

export default CFooter;
