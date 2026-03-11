import { Avatar, Container, Stack } from "@mui/material";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTabs from "../../components/navigation/CTabs";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";
import GPageBase from "../common/GPageBases";
import ProfileMatchHistoryPanel from "./PProfileMatchHistoryPanel";
import ProfileStatisticsPanel from "./PProfileStatisticsPanel";

interface PProfilePublicProps {
	username: string;
}

function PProfilePublic({ username }: PProfilePublicProps) {
	const publicRank = "Silver";

	return (
		<GPageBase>
			<Container maxWidth="lg">
				<Stack spacing={3} sx={{ mt: 3 }}>
					<CBasePaper sx={{ p: 3 }}>
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={2}
							alignItems={{ xs: "flex-start", sm: "center" }}
						>
							<Avatar
								sx={{
									width: 88,
									height: 88,
									bgcolor: "secondary.main",
									fontWeight: "bold",
									fontSize: "2rem",
								}}
							>
								{username.charAt(0).toUpperCase()}
							</Avatar>
							<Stack>
								<CTitle size="md">{username}</CTitle>
								<CText size="sm">Title: {publicRank}</CText>
								<CText size="sm">XP: 920</CText>
							</Stack>
						</Stack>
					</CBasePaper>

					<CBasePaper>
						<CTabs tabs={["Statistics", "Match history"]}>
							<ProfileStatisticsPanel scope="public" />
							<ProfileMatchHistoryPanel scope="public" />
						</CTabs>
					</CBasePaper>
				</Stack>
			</Container>
		</GPageBase>
	);
}

export default PProfilePublic;
