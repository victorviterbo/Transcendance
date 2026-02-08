import { useState } from "react";
import { TextField } from "@mui/material";
import type { GPageProps } from "../common/GPageProps";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
import { API_AUTH_LOGIN } from "../../constants";
import api from "../../api";
import { useAuth } from "../../components/auth/CAuthProvider";

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
			const res = await api.post(API_AUTH_LOGIN, { email, password });
			const decoded = jwtDecode<{ sub?: string; username?: string; email?: string }>(
				res.data.access,
			);
			const user: IAuthUser = {
				id: decoded.sub ? Number(decoded.sub) : 0,
				username: decoded.username ?? "",
				email: decoded.email ?? "",
			};
			setAuth(res.data.access, user);
			onSuccess?.(user);
			return { valid: true };
		} catch (error) {
			const message =
				typeof error === "object" && error !== null
					? ((error as { response?: { data?: { error?: string } } }).response?.data
							?.error ?? "Login failed.")
					: "Login failed.";
			return { valid: false, msg: message };
		}
	}
	// async function onSubmit(): Promise<IEventStatus> {
	// 	return fetch(API_AUTH_LOGIN, {
	// 		method: "POST",
	// 		headers: {
	// 			"Content-Type": "application/json",
	// 		},
	// 		body: JSON.stringify({ email, password }),
	// 	})
	// 		.then(async (response: Response): Promise<IEventStatus> => {
	// 			if (!response.ok) {
	// 				return {
	// 					valid: false,
	// 					msg: await getErrorMessage(response, "Login failed."),
	// 				};
	// 			}
	// 			const user: IAuthUser = (await response.json()) as IAuthUser;
	// 			onSuccess?.(user);
	// 			return { valid: true };
	// 		})
	// 		.catch((error: unknown) => {
	// 			return {
	// 				valid: false,
	// 				msg: error instanceof Error ? error.message : String(error),
	// 			};
	// 		});
	// }

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
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
		</CForm>
	);
};

export default PLoginForm;
