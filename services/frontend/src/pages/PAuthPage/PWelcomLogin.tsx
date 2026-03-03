import { Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { IAuthUser } from "../../types/user";
import type { GPageProps } from "../common/GPageBases";

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
	const navigate = useNavigate();
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
			<Button
				variant="contained"
				fullWidth
				onClick={() => {
					onReset?.();
					navigate("/");
				}}
			>
				Back to Home
			</Button>
		</>
	);
}

export default PWelcomLogin;
