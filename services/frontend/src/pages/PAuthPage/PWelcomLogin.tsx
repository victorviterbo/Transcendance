import { Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { IAuthUser } from "../../types/user";
import type { GPageProps } from "../common/GPageBases";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { ttrf } from "../../localization/localization";

//--------------------------------------------------
//                TYPES / INTERFACES
//--------------------------------------------------
interface PWelcomLoginProps extends GPageProps {
	//Data
	user: IAuthUser;
	isBack: boolean;
}

//--------------------------------------------------
//                   COMPONENT
//--------------------------------------------------
function PWelcomLogin({ user, isBack }: PWelcomLoginProps) {
	const navigate = useNavigate();
	const message = ttrf(isBack ? "WELCOME_BACK_USER" : "WELCOME_ACCOUNT_READY_USER", {
		username: user.username,
	});
	//====================== DOM ======================
	return (
		<>
			<Stack sx={{ alignItems: "center" }}>
				<Typography align="center" sx={{ mb: 3 }}>
					{message}
				</Typography>
				<CButtonText
					variant="contained"
					onClick={() => {
						navigate("/", { replace: true });
					}}
				>
					BACK_TO_HOME
				</CButtonText>
			</Stack>
		</>
	);
}

export default PWelcomLogin;
