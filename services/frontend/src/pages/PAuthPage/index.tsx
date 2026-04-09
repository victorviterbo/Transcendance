import { useState } from "react";
import { Container } from "@mui/material";
import { Navigate } from "react-router-dom";
import PLoginForm from "./PLoginForm";
import PRegisterForm from "./PRegisterForm";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTabs from "../../components/navigation/CTabs";
import type { IAuthUser } from "../../types/user";
import PWelcomLogin from "./PWelcomLogin";
import GPageBase from "../common/GPageBases";
import { useAuth } from "../../components/auth/CAuthProvider";

const PAuthPage = () => {
	const [user, setUser] = useState<IAuthUser | null>(null);
	const [isBack, setIsBack] = useState<boolean>(true);
	const { status } = useAuth();

	if (!user && status === "loading") return null;
	if (!user && status === "authed") return <Navigate to="/" replace />;

	return (
		<GPageBase>
			<Container sx={{ mt: "5%" }} maxWidth="sm">
				<CTitlePaper title="WELCOME" titleType="title" titleSize="md">
					{!user ? (
						<CTabs tabs={["LOGIN", "SIGNUP"]}>
							<PLoginForm
								onSuccess={(nextUser: IAuthUser) => {
									setUser(nextUser);
									setIsBack(true);
								}}
							/>
							<PRegisterForm
								onSuccess={(nextUser: IAuthUser) => {
									setUser(nextUser);
									setIsBack(false);
								}}
							/>
						</CTabs>
					) : (
						<PWelcomLogin user={user} isBack={isBack} />
					)}
				</CTitlePaper>
			</Container>
		</GPageBase>
	);
};

export default PAuthPage;
