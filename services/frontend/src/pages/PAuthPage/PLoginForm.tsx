import { useState } from "react";
import { TextField } from "@mui/material";
import type { GPageProps } from "../common/GPageProps";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
import { checkEmailValid } from "../../utils/enforcement";
import { API_AUTH_LOGIN } from "../../constants";
import api from "../../api";
import { useAuth } from "../../components/auth/CAuthProvider";
import { getErrorMessage } from "../../utils/error";
import type { TLoginFormState } from "../../types/form";

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
	//====================== HELPERS ======================
	const setField = (name: keyof TLoginFormState, value: string, errors: string[]) => {
		setForm((prev) => ({
			...prev,
			[name]: {
				value,
				errors,
			},
		}));
	};

	const validateRequired = () => {
		const requiredErrors = Object.fromEntries(
			Object.entries(form).map(([key, field]) => [
				key,
				field.value.trim() ? [] : ["Please fill this"],
			]),
		) as Record<keyof TLoginFormState, string[]>;

		const nextErrors = Object.fromEntries(
			Object.entries(form).map(([key, field]) => {
				const required = requiredErrors[key as keyof TLoginFormState];
				const merged = field.errors.length > 0 ? field.errors : required;
				return [key, merged];
			}),
		) as Record<keyof TLoginFormState, string[]>;

		const hasErrors = Object.values(nextErrors).some((errors) => errors.length > 0);
		if (hasErrors) {
			setForm((prev) => ({
				...prev,
				email: { ...prev.email, errors: nextErrors.email },
				password: { ...prev.password, errors: nextErrors.password },
			}));
			return false;
		}
		return true;
	};

	//====================== DATA ======================
	const [form, setForm] = useState<TLoginFormState>({
		email: { value: "", errors: [] },
		password: { value: "", errors: [] },
	});
	const { setAuth } = useAuth();

	//====================== EVENTS ======================
	async function handleLogin(): Promise<IEventStatus> {
		try {
			if (!validateRequired()) return { valid: false };
			if (Object.values(form).some((field) => field.errors.length > 0))
				return { valid: false };
			const res = await api.post<{ access?: string; username?: string }>(API_AUTH_LOGIN, {
				email: form.email.value,
				password: form.password.value,
			});
			if (!res.data?.access || !res.data?.username) {
				return { valid: false, msg: "Login failed." };
			}
			const username = res.data.username;
			const user: IAuthUser = { username, email: form.email.value };
			setAuth(res.data.access, user);
			onSuccess?.(user);
			return { valid: true };
		} catch (error) {
			return { valid: false, msg: getErrorMessage(error, "Login failed.") };
		}
	}

	//====================== DOM ======================
	//TODO: ABSTRACT FORM TO BE REUSABLE
	return (
		<CForm submitText="Log in" submittingText="Logging in ..." onSubmit={handleLogin}>
			<TextField
				label="Email"
				name="email"
				type="email"
				fullWidth
				margin="normal"
				value={form.email.value}
				error={form.email.errors.length > 0}
				helperText={form.email.errors.join(" ")}
				onChange={(e) => setField("email", e.target.value, checkEmailValid(e.target.value))}
				required
			/>

			<TextField
				label="Password"
				name="password"
				type="password"
				fullWidth
				margin="normal"
				value={form.password.value}
				error={form.password.errors.length > 0}
				helperText={form.password.errors.join(" ")}
				onChange={(e) => setField("password", e.target.value, [])}
				required
			/>
		</CForm>
	);
};

export default PLoginForm;
