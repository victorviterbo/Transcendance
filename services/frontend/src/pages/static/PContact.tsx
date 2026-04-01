import { Box } from "@mui/material";
import CContactCard from "../../components/surfaces/CContactCard";
import CText from "../../components/text/CText";
import PStaticPageShell from "./PStaticPageShell";

interface ContactMember {
	name: string;
	image: string;
	email: string;
	roles: string[];
}

const contactMembers: ContactMember[] = [
	{
		name: "fmixtur",
		image: "/imgs/pp/fmixtur.jpg",
		email: "fmixtur@student.42lausanne.ch",
		roles: ["PROJECT_MANAGER", "DEVELOPER"],
	},
	{
		name: "hcavet",
		image: "/imgs/pp/hcavet.jpg",
		email: "hcavet@student.42lausanne.ch",
		roles: ["PRODUCT_OWNER", "DEVELOPER"],
	},
	{
		name: "kgauthie",
		image: "/imgs/pp/kgauthie.jpg",
		email: "kgauthie@student.42lausanne.ch",
		roles: ["DEVELOPER"],
	},
	{
		name: "vviterbo",
		image: "/imgs/pp/vviterbo.jpg",
		email: "vviterbo@student.42lausanne.ch",
		roles: ["TECH_LEAD", "DEVELOPER"],
	},
	{
		name: "yisho",
		image: "/imgs/pp/yisho.jpg",
		email: "yisho@student.42lausanne.ch",
		roles: ["DEVELOPER"],
	},
];

const PContact = () => {
	return (
		<PStaticPageShell title="CONTACT">
			<CText size="md" align="center">
				CONTACT_INTRO
			</CText>

			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "repeat(2, minmax(0, 1fr))",
						lg: "repeat(5, minmax(0, 1fr))",
					},
					gap: 3,
				}}
			>
				{contactMembers.map((member) => (
					<CContactCard
						key={member.image}
						name={member.name}
						image={member.image}
						email={member.email}
						roles={member.roles}
					/>
				))}
			</Box>
		</PStaticPageShell>
	);
};

export default PContact;
