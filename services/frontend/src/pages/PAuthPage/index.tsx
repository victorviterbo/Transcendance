import { useState } from "react";
import { Box, Container, Stack } from "@mui/material";
import PLoginForm from "./PLoginForm";
import PRegisterForm from "./PRegisterForm";
import CTitle from "../../components/text/CTitle";
import CBasePaper from "../../components/surfaces/CBasePaper";
import CTabs from "../../components/navigation/CTabs";
import type { IAuthUser } from "../../types/user";
import PWelcomLogin from "./PWelcomLogin";
import CDialogLanguage from "../../components/feedback/dialogs/CDialogLanguage";

const PAuthPage = () => {
	const [user, setUser] = useState<IAuthUser | null>(null);
	const [isBack, setIsBack] = useState<boolean>(true);

	return (
		<>
			<Stack direction={"row"}>
				<Box sx={{ flexGrow: 1 }} />
				<CDialogLanguage open={false} />
			</Stack>

			<Container maxWidth="sm">
				<CBasePaper>
					<CTitle size="md" align="center">
						WELCOME
					</CTitle>

					<Box sx={{ verticalAlign: "centered" }}>
						<img src="imgs/shared/T_Vinyle.gif"></img>
					</Box>

					{!user ? (
						<CTabs tabs={["login", "register"]}>
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
