import { useMemo } from "react";
import type { GPageProps } from "../common/GPageBases";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
import { checkUsernameValid, checkEmailValid, checkPasswordValid } from "../../utils/enforcement";
import { API_AUTH_REGISTER } from "../../constants";
import api from "../../api";
import { useAuth } from "../../components/auth/CAuthProvider";
import { getErrorMessage } from "../../utils/error";
import type { TFormFieldConfig } from "../../types/form";

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
	const fields = useMemo<TFormFieldConfig[]>(
		() => [
			{
				name: "username",
				label: "USERNAME",
				required: true,
				validate: checkUsernameValid,
			},
			{
				name: "email",
				label: "EMAIL",
				type: "email",
				required: true,
				validate: checkEmailValid,
			},
			{
				name: "password",
				label: "PASSWORD",
				type: "password",
				required: true,
				validate: checkPasswordValid,
				confirm: {
					name: "confirmPassword",
					error: "PASSWORD_MISMATCH",
					required: true,
				},
			},
		],
		[],
	);
	const { setAuth } = useAuth();

	//====================== EVENTS ======================
	async function handleRegister(values: Record<string, string>): Promise<IEventStatus> {
		try {
			const res = await api.post<{ access?: string; username?: string }>(API_AUTH_REGISTER, {
				username: values.username.trim(),
				email: values.email.trim(),
				password: values.password,
			});
			if (!res.data?.access || !res.data?.username) {
				return { valid: false, msg: "Registration failed." };
			}
			const user: IAuthUser = { username: res.data.username, email: values.email };
			setAuth(res.data.access, user);
			onSuccess?.(user);
			return { valid: true };
		} catch (error) {
			const maybe = error as {
				response?: { data?: { error?: Record<string, string> } };
			};
			const payload = maybe.response?.data?.error;
			if (payload && typeof payload === "object") {
				return { valid: false, fieldErrors: payload };
			}
			return { valid: false, msg: getErrorMessage(error, "Registration failed.") };
		}
	}

	return (
		<CForm
			submitText="SIGNUP"
			submittingText="SIGNING_UP"
			fields={fields}
			onSubmit={handleRegister}
		/>
	);
};

export default PRegisterForm;
