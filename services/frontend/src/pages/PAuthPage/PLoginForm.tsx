import { useState } from "react";
import { TextField } from "@mui/material";
import type { GPageProps } from "../common/GPageProps";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
import { API_AUTH_LOGIN } from "../../constants";
import api from "../../api";
import { useAuth } from "../../components/auth/CAuthProvider";
import { getErrorMessage } from "../../utils/error";

//--------------------------------------------------
//                 TYPES / INTERAFCES
//--------------------------------------------------
interface LoginFormProps extends GPageProps {
	onSuccess?: (user: IAuthUser) => void;
}

//--------------------------------------------------
//                    COMPONENTS
//--------------------------------------------------
const PLoginForm = ({ onSuccess }: LoginFormProps) => {
	//====================== stats ======================
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { setAuth } = useAuth();

	//====================== EVENTS ======================
	async function handleLogin(): Promise<IEventStatus> {
		try {
			const res = await api.post<{ access?: string; username?: string }>(API_AUTH_LOGIN, {
				email,
				password,
			});
			if (!res.data?.access || !res.data?.username) {
				return { valid: false, msg: "Login failed." };
			}
			const username = res.data.username;
			const user: IAuthUser = { username, email };
			setAuth(res.data.access, user);
			onSuccess?.(user);
			return { valid: true };
		} catch (error) {
			return { valid: false, msg: getErrorMessage(error, "Login failed.") };
		}
	}

	//====================== DOM ======================
	//TODO: TEXT_FIELD
	return (
		<CForm submitText="Log in" submittingText="Logging in ..." onSubmit={handleLogin}>
			<TextField
				label="Email"
				name="email"
				type="email"
				fullWidth
				margin="normal"
				onChange={(e) => setEmail(e.target.value)}
				required
			/>

			<TextField
				label="Password"
				name="password"
				type="password"
				fullWidth
				margin="normal"
				onChange={(e) => {
					setPassword(e.target.value);
				}}
				required
			/>
		</CForm>
	);
};

export default PLoginForm;
