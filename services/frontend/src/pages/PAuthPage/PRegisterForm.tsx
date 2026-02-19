import { useState } from "react";
import { Box, TextField } from "@mui/material";
import type { GPageProps } from "../common/GPageProps";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
import {
	checkUsernameValid,
	checkEmailValid,
	checkPasswordValid,
	checkConfirmPasswordValid,
} from "../../utils/enforcement";
import { API_AUTH_REGISTER } from "../../constants";
import api from "../../api";
import { useAuth } from "../../components/auth/CAuthProvider";
import { getErrorMessage } from "../../utils/error";
import { type TFormState } from "../../types/form";

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
	const setField = (name: keyof TFormState, value: string, errors: string[]) => {
		setForm((prev) => ({
			...prev,
			[name]: {
				value,
				errors,
			},
		}));
	};

	const setBackendErrors = (errors: Partial<Record<keyof TFormState, string>>) => {
		setForm((prev) => ({
			...prev,
			username: { ...prev.username, errors: errors.username ? [errors.username] : [] },
			email: { ...prev.email, errors: errors.email ? [errors.email] : [] },
		}));
	};

	const validateRequired = () => {
		const requiredErrors = Object.fromEntries(
			Object.entries(form).map(([key, field]) => [
				key,
				field.value.trim() ? [] : ["Please fill this"],
			]),
		) as Record<keyof TFormState, string[]>;

		const nextErrors = Object.fromEntries(
			Object.entries(form).map(([key, field]) => {
				const required = requiredErrors[key as keyof TFormState];
				const merged = field.errors.length > 0 ? field.errors : required;
				return [key, merged];
			}),
		) as Record<keyof TFormState, string[]>;

		const hasErrors = Object.values(nextErrors).some((errors) => errors.length > 0);
		if (hasErrors) {
			setForm((prev) => ({
				...prev,
				username: { ...prev.username, errors: nextErrors.username },
				email: { ...prev.email, errors: nextErrors.email },
				password: { ...prev.password, errors: nextErrors.password },
				confirmPassword: { ...prev.confirmPassword, errors: nextErrors.confirmPassword },
			}));
			return false;
		}
		return true;
	};

	const renderErrors = (errors: string[]) => {
		if (errors.length === 0) return "";
		if (errors.length === 1) return errors[0];
		return (
			<Box component="ul" sx={{ m: 0, pl: 2 }}>
				{errors.map((msg) => (
					<li key={msg}>{msg}</li>
				))}
			</Box>
		);
	};

	const [form, setForm] = useState<TFormState>({
		username: { value: "", errors: [] },
		email: { value: "", errors: [] },
		password: { value: "", errors: [] },
		confirmPassword: { value: "", errors: [] },
	});
	const { setAuth } = useAuth();

	//====================== DATA ======================

	//====================== EVENTS ======================
	async function handleRegister(): Promise<IEventStatus> {
		try {
			if (!validateRequired()) return { valid: false };
			if (Object.values(form).some((field) => field.errors.length > 0))
				return { valid: false };
			const res = await api.post<{ access?: string; username?: string }>(API_AUTH_REGISTER, {
				username: form.username.value,
				email: form.email.value,
				password: form.password.value,
			});
			if (!res.data?.access || !res.data?.username) {
				return { valid: false, msg: "Registration failed." };
			}
			const user: IAuthUser = { username: res.data.username, email: form.email.value };
			setAuth(res.data.access, user);
			onSuccess?.(user);
			return { valid: true };
		} catch (error) {
			const maybe = error as {
				response?: { data?: { error?: Record<string, string> } };
			};
			const payload = maybe.response?.data?.error;
			if (payload && typeof payload === "object") {
				setBackendErrors(payload);
				return { valid: false };
			}
			return { valid: false, msg: getErrorMessage(error, "Registration failed.") };
		}
	}

	//====================== DOM ======================
	return (
		<CForm submitText="Sign in" submittingText="Signing in ..." onSubmit={handleRegister}>
			<TextField
				label="Username"
				fullWidth
				margin="normal"
				value={form.username.value}
				error={Boolean(form.username.errors.length)}
				slotProps={{ formHelperText: { component: "div" } }}
				helperText={renderErrors(form.username.errors)}
				onChange={(e) =>
					setField("username", e.target.value, checkUsernameValid(e.target.value))
				}
				required
			/>

			<TextField
				label="Email"
				type="email"
				fullWidth
				margin="normal"
				value={form.email.value}
				error={Boolean(form.email.errors.length)}
				slotProps={{ formHelperText: { component: "div" } }}
				helperText={renderErrors(form.email.errors)}
				onChange={(e) => setField("email", e.target.value, checkEmailValid(e.target.value))}
				required
			/>

			<TextField
				label="Password"
				type="password"
				fullWidth
				margin="normal"
				value={form.password.value}
				error={Boolean(form.password.errors.length)}
				slotProps={{ formHelperText: { component: "div" } }}
				helperText={renderErrors(form.password.errors)}
				onChange={(e) => {
					setField("password", e.target.value, checkPasswordValid(e.target.value));
					setField(
						"confirmPassword",
						form.confirmPassword.value,
						checkConfirmPasswordValid(e.target.value, form.confirmPassword.value),
					);
				}}
				required
			/>

			<TextField
				label="Confirm Password"
				type="password"
				fullWidth
				margin="normal"
				value={form.confirmPassword.value}
				error={Boolean(form.confirmPassword.errors.length)}
				slotProps={{ formHelperText: { component: "div" } }}
				helperText={renderErrors(form.confirmPassword.errors)}
				onChange={(e) =>
					setField(
						"confirmPassword",
						e.target.value,
						checkConfirmPasswordValid(form.password.value, e.target.value),
					)
				}
				required
			/>
		</CForm>
	);
};

export default PRegisterForm;
