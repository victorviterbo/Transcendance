import { useState } from "react";
import { TextField } from "@mui/material";
import type { GPageProps } from "../common/GPageProps";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
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

	//====================== EVENTS ======================
	async function onSubmit(): Promise<IEventStatus> {
		return fetch(`/api/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		})
			.then(async (response: Response): Promise<IEventStatus> => {
				if (!response.ok) {
					return {
						valid: false,
						msg: await getErrorMessage(response, "Login failed."),
					};
				}
				const user: IAuthUser = (await response.json()) as IAuthUser;
				onSuccess?.(user);
				return { valid: true };
			})
			.catch((error: unknown) => {
				return {
					valid: false,
					msg: error instanceof Error ? error.message : String(error),
				};
			});
	}

	//====================== DOM ======================
	//TODO: TEXT_FIELD
	return (
		<CForm submitText="Log in" submittingText="Logging in ..." onSubmit={onSubmit}>
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
