import { useMemo } from "react";
import type { GPageProps } from "../common/GPageBases";
import type { IAuthUser } from "../../types/user";
import CForm from "../../components/layout/CForm";
import type { IEventStatus } from "../../types/events";
import { checkEmailValid } from "../../utils/enforcement";
import { API_AUTH_LOGIN } from "../../constants";
import api from "../../api";
import { useAuth } from "../../components/auth/CAuthProvider";
import { getErrorMessage } from "../../utils/error";
import type { TFormFieldConfig } from "../../types/form";

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
	const fields = useMemo<TFormFieldConfig[]>(
		() => [
			{
				name: "email",
				label: "Email",
				type: "email",
				required: true,
				validate: checkEmailValid,
			},
			{
				name: "password",
				label: "Password",
				type: "password",
				required: true,
			},
		],
		[],
	);
	const { setAuth } = useAuth();

	//====================== EVENTS ======================
	async function handleLogin(values: Record<string, string>): Promise<IEventStatus> {
		try {
			const res = await api.post<{ access?: string; username?: string }>(API_AUTH_LOGIN, {
				email: values.email.trim(),
				password: values.password.trim(),
			});
			if (!res.data?.access || !res.data?.username) {
				return { valid: false, msg: "Login failed." };
			}
			const username = res.data.username;
			const user: IAuthUser = { username, email: values.email };
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
		<CForm
			submitText="Log in"
			submittingText="Logging in ..."
			fields={fields}
			onSubmit={handleLogin}
		/>
	);
};

export default PLoginForm;
