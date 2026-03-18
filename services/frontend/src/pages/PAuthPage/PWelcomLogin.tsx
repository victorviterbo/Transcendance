import { Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { IAuthUser } from "../../types/user";
import type { GPageProps } from "../common/GPageBases";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import CText from "../../components/text/CText";
import CTitle from "../../components/text/CTitle";

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
		<Stack sx={{ alignItems: "center", textAlign: "center" }} spacing={2.5}>
			<CTitle size="md">ALL SET</CTitle>
			<CText size="lg" sx={{ maxWidth: "24rem", lineHeight: 1.5 }}>
				{getMSG()}
			</CText>
			<CButtonText
				variant="contained"
				sx={{ width: "100%" }}
				onClick={() => {
					onReset?.();
					navigate("/");
				}}
			>
				BACK TO HOME
			</CButtonText>
		</Stack>
	);
}

export default PWelcomLogin;
