import { useState } from "react";
import { Container } from "@mui/material";
import PLoginForm from "./PLoginForm";
import PRegisterForm from "./PRegisterForm";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTabs from "../../components/navigation/CTabs";
import type { IAuthUser } from "../../types/user";
import PWelcomLogin from "./PWelcomLogin";
import GPageBase from "../common/GPageBases";

const PAuthPage = () => {
	const [user, setUser] = useState<IAuthUser | null>(null);
	const [isBack, setIsBack] = useState<boolean>(true);

	return (
		<GPageBase>
			<Container sx={{ mt: "5%" }} maxWidth="sm">
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
			</Container>
		</GPageBase>
	);
};

export default PAuthPage;
