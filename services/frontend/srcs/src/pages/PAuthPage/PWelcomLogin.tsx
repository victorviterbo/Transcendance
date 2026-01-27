import { Typography, Button } from "@mui/material";
import type { IAuthUser } from "../../types/user";
import type { GPageProps } from "../common/GPageProps";

//--------------------------------------------------
//                TYPES / INTERFACES
//--------------------------------------------------
interface PWelcomLoginProps extends GPageProps {
	//Data
	user: IAuthUser;
	isBack: boolean;

	//Events
	onReset?: () => void;
}

//--------------------------------------------------
//                   COMPONENT
//--------------------------------------------------
//TODO: Replace with cutom button and text
function PWelcomLogin({ user, isBack, onReset }: PWelcomLoginProps) {
	//====================== FUNCTIONS ======================
	function getMSG(): string {
		if (isBack) return `Welcome back, ${user.username}!`;
		return `Welcome, ${user.username}! Your account is ready.`;
	}

	//====================== DOM ======================
	return (
		<>
			<Typography align="center" sx={{ mb: 3 }}>
				{getMSG()}
			</Typography>
			<Button variant="contained" fullWidth onClick={onReset}>
				Back to Auth
			</Button>
		</>
	);
}

export default PWelcomLogin;
