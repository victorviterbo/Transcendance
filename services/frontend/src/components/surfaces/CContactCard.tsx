import { Box, Stack } from "@mui/material";
import CBasePaper, { type CBasePaperProps } from "./CBasePaper";
import CText from "../text/CText";

export interface CContactCardProps extends Omit<CBasePaperProps, "children" | "component"> {
	name: string;
	image: string;
	email: string;
	roles: string[];
}

function CContactCard({ name, image, email, roles, className, sx, ...other }: CContactCardProps) {
	return (
		<Box
			component="a"
			href={`mailto:${email}`}
			className={className}
			sx={{
				display: "block",
				height: "100%",
				color: "inherit",
				textDecoration: "none",
				"&:hover .CContactCard-paper": {
					transform: "translateY(-4px)",
					boxShadow: "0 20px 32px rgba(0, 0, 0, 0.3)",
				},
			}}
		>
			<CBasePaper
				className="CContactCard-paper"
				sx={[
					{
						p: 1.25,
						height: "100%",
						overflow: "hidden",
						transition: "transform 150ms ease, box-shadow 150ms ease",
					},
					...(Array.isArray(sx) ? sx : sx ? [sx] : []),
				]}
				{...other}
			>
				<Stack spacing={1.5} sx={{ height: "100%" }}>
					<Box
						component="img"
						src={image}
						alt={`${name} portrait`}
						sx={{
							display: "block",
							width: "100%",
							aspectRatio: "4 / 5",
							objectFit: "cover",
							borderRadius: 2,
							boxShadow: "0 14px 28px rgba(0, 0, 0, 0.28)",
						}}
					/>
					<CText size="lg" align="center" sx={{ mb: 0, fontWeight: 700 }}>
						{name}
					</CText>
					<Stack spacing={0.25} alignItems="center" sx={{ mt: "auto" }}>
						{roles.map((role) => (
							<CText
								key={`${name}-${role}`}
								size="sm"
								align="center"
								sx={{ mb: 0, opacity: 0.82 }}
							>
								{role}
							</CText>
						))}
					</Stack>
				</Stack>
			</CBasePaper>
		</Box>
	);
}

export default CContactCard;
