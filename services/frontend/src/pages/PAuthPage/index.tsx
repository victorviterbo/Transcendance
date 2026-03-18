import { useState } from "react";
import { Box, Container, Stack } from "@mui/material";
import PLoginForm from "./PLoginForm";
import PRegisterForm from "./PRegisterForm";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTabs from "../../components/navigation/CTabs";
import type { IAuthUser } from "../../types/user";
import PWelcomLogin from "./PWelcomLogin";
import GPageBase from "../common/GPageBases";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTitle from "../../components/text/CTitle";
import CText from "../../components/text/CText";

const PAuthPage = () => {
	const [user, setUser] = useState<IAuthUser | null>(null);
	const [isBack, setIsBack] = useState<boolean>(true);

	return (
		<GPageBase>
			<Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
				<Stack direction={{ xs: "column", lg: "row" }} spacing={4} alignItems="stretch">
					<CBasePaper
						sx={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							minHeight: { xs: 260, lg: 540 },
							background:
								"radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 24%), linear-gradient(135deg, rgba(73, 238, 255, 0.2) 0%, rgba(83, 107, 255, 0.28) 42%, rgba(255, 88, 188, 0.3) 100%), linear-gradient(145deg, #3342AA 0%, #4C35C0 48%, #822BC2 100%)",
						}}
					>
						<Stack spacing={2.5} sx={{ maxWidth: "31rem" }}>
							<Box
								sx={{
									width: "fit-content",
									px: 1.75,
									py: 0.8,
									borderRadius: "999px",
									backgroundColor: "rgba(255, 255, 255, 0.14)",
									border: "2px solid rgba(255, 255, 255, 0.24)",
								}}
							>
								<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.92)" }}>
									PARTY PASS
								</CText>
							</Box>
							<CTitle
								size="lg"
								sx={{
									fontSize: { xs: "2.5rem", md: "4rem" },
									color: "common.white",
								}}
							>
								READY FOR THE NEXT ROUND?
							</CTitle>
							<CText
								size="lg"
								sx={{
									fontSize: { xs: "1rem", md: "1.1rem" },
									lineHeight: 1.55,
									color: "rgba(255, 255, 255, 0.9)",
								}}
							>
								Log in to join friends, spin up a room, and keep the music sprint
								bright and readable instead of buried under default form chrome.
							</CText>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap>
								<Box
									sx={{
										px: 2,
										py: 1.2,
										borderRadius: "22px",
										backgroundColor: "rgba(23, 15, 56, 0.18)",
										border: "2px solid rgba(255, 255, 255, 0.24)",
									}}
								>
									<CText size="sm">Private lobbies</CText>
								</Box>
								<Box
									sx={{
										px: 2,
										py: 1.2,
										borderRadius: "22px",
										backgroundColor: "rgba(23, 15, 56, 0.18)",
										border: "2px solid rgba(255, 255, 255, 0.24)",
									}}
								>
									<CText size="sm">Profile stats</CText>
								</Box>
								<Box
									sx={{
										px: 2,
										py: 1.2,
										borderRadius: "22px",
										backgroundColor: "rgba(23, 15, 56, 0.18)",
										border: "2px solid rgba(255, 255, 255, 0.24)",
									}}
								>
									<CText size="sm">Fast matchmaking</CText>
								</Box>
							</Stack>
						</Stack>
					</CBasePaper>
					<Box sx={{ flex: 1, width: "100%", maxWidth: { lg: "34rem" }, mx: "auto" }}>
						<CTitlePaper title="WELCOME" titleType="title" titleSize="md">
							{!user ? (
								<CTabs tabs={["LOGIN", "SIGNUP"]}>
									<PLoginForm
										onSuccess={(user: IAuthUser) => {
											setUser(user);
											setIsBack(true);
										}}
									/>
									<PRegisterForm
										onSuccess={(user: IAuthUser) => {
											setUser(user);
											setIsBack(false);
										}}
									/>
								</CTabs>
							) : (
								<PWelcomLogin
									user={user}
									isBack={isBack}
									onReset={() => {
										setUser(null);
									}}
								></PWelcomLogin>
							)}
						</CTitlePaper>
					</Box>
				</Stack>
			</Container>
		</GPageBase>
	);
};

export default PAuthPage;
