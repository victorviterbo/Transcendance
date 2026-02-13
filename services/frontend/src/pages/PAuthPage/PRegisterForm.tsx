import { useState } from "react";
import { Box, TextField } from "@mui/material";
import type { GPageProps } from "../common/GPageProps";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
import { checkPasswordValid } from "../../utils/enforcement";
import { API_AUTH_REGISTER } from "../../constants";
import api from "../../api";
import { useAuth } from "../../components/auth/CAuthProvider";
import { getErrorMessage } from "../../utils/error";

//--------------------------------------------------
//                 TYPES / INTERAFCES
//--------------------------------------------------
interface PRegisterFormProps extends GPageProps {
	onSuccess?: (user: IAuthUser) => void;
}

//--------------------------------------------------
//                    COMPONENTS
//--------------------------------------------------
const PRegisterForm = ({ onSuccess }: PRegisterFormProps) => {
	//====================== stats ======================
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const { setAuth } = useAuth();

	//====================== DATA ======================
	const passwordErrors: string[] | null = checkPasswordValid(password);
	const passwordMissmatch: string | null =
		password == confirmPassword || confirmPassword.length == 0
			? null
			: "Passwords do not match";

	//====================== EVENTS ======================
	async function handleRegister(): Promise<IEventStatus> {
		try {
			const res = await api.post<{ access?: string; username?: string }>(API_AUTH_REGISTER, {
				username,
				email,
				password,
			});
			if (!res.data?.access || !res.data?.username) {
				return { valid: false, msg: "Registration failed." };
			}
			const responseUsername = res.data.username;
			const user: IAuthUser = { username: responseUsername, email };
			setAuth(res.data.access, user);
			onSuccess?.(user);
			return { valid: true };
		} catch (error) {
			return { valid: false, msg: getErrorMessage(error, "Registration failed.") };
		}
		// async function onSubmit(): Promise<IEventStatus> {
		// 	return fetch(API_AUTH_REGISTER, {
		// 		method: "POST",
		// 		headers: {
		// 			"Content-Type": "application/json",
		// 		},
		// 		body: JSON.stringify({ username, email, password }),
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
	}

	//====================== DOM ======================
	return (
		<CForm submitText="Sign in" submittingText="Signing in ..." onSubmit={handleRegister}>
			<TextField
				label="Username"
				fullWidth
				margin="normal"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				required
			/>

			<TextField
				label="Email"
				type="email"
				fullWidth
				margin="normal"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>

			<TextField
				label="Password"
				type="password"
				fullWidth
				margin="normal"
				error={passwordErrors ? true : false}
				slotProps={{ formHelperText: { component: "div" } }}
				helperText={
					passwordErrors ? (
						// TODO custom Box? sx parameters?
						<Box component="ul">
							{passwordErrors.map((message) => (
								<li key={message}>{message}</li>
							))}
						</Box>
					) : (
						""
					)
				}
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>

			<TextField
				label="Confirm Password"
				type="password"
				fullWidth
				margin="normal"
				error={passwordMissmatch ? true : false}
				helperText={passwordMissmatch ? passwordMissmatch : ""}
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				required
			/>
		</CForm>
	);
};

export default PRegisterForm;
