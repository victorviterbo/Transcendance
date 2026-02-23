import { useState } from "react";
import { Container } from "@mui/material";
import PLoginForm from "./PLoginForm";
import PRegisterForm from "./PRegisterForm";
import CTitle from "../../components/text/CTitle";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTabs from "../../components/navigation/CTabs";
import type { IAuthUser } from "../../types/user";
import PWelcomLogin from "./PWelcomLogin";

const PAuthPage = () => {
	const [user, setUser] = useState<IAuthUser | null>(null);
	const [isBack, setIsBack] = useState<boolean>(true);

	return (
		<>
			<Container maxWidth="sm">
				<CBasePaper>
					<CTitle size="md" align="center">
						WELCOME
					</CTitle>

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
				</CBasePaper>
			</Container>
		</>
	);
};

export default PAuthPage;
