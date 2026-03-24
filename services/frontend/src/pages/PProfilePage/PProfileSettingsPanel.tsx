import { type SyntheticEvent, useMemo, useState } from "react";
import type { GPageProps } from "../common/GPageBases";
import type { TFormFieldConfig } from "../../types/form";
import type { IEventStatus } from "../../types/events";
import { checkEmailValid, checkPasswordValid, checkUsernameValid } from "../../utils/enforcement";
import CForm from "../../components/layout/CForm";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import api, { getAccessToken } from "../../api";
import { getErrorMessage } from "../../utils/error.tsx";
import { API_PROFILE } from "../../constants";
import CTitle from "../../components/text/CTitle";
import { useAuth } from "../../components/auth/CAuthProvider";

export interface ProfileSettingsPanelProps extends GPageProps {
	username: string | undefined;
}

const PProfileSettingsPanel = ({ username }: ProfileSettingsPanelProps) => {
	const [expanded, setExpanded] = useState<string | false>("username");
	const { setAuth, user } = useAuth();
	const usernameFields = useMemo<TFormFieldConfig[]>(
		() => [
			{
				name: "username",
				label: "NEW_USERNAME",
				type: "username",
				required: true,
				validate: checkUsernameValid,
			},
		],
		[],
	);
	const emailFields = useMemo<TFormFieldConfig[]>(
		() => [
			{
				name: "email",
				label: "NEW_EMAIL",
				type: "email",
				required: true,
				validate: checkEmailValid,
			},
		],
		[],
	);
	const passwordFields = useMemo<TFormFieldConfig[]>(
		() => [
			{
				name: "currentPassword",
				label: "CURRENT_PASSWORD",
				type: "password",
				required: true,
			},
			{
				name: "newPassword",
				label: "NEW_PASSWORD",
				type: "password",
				required: true,
				validate: checkPasswordValid,
				confirm: {
					name: "confirmNewPassword",
					error: "PASSWORD_MISMATCH",
					required: true,
				},
			},
		],
		[],
	);
	const deleteFields = useMemo<TFormFieldConfig[]>(
		() => [
			{
				name: "password",
				label: "PASSWORD",
				type: "password",
				required: true,
				confirm: {
					name: "confirmPassword",
					error: "PASSWORD_MISMATCH",
					required: true,
				},
			},
		],
		[],
	);

	async function handleChangeUsername(values: Record<string, string>): Promise<IEventStatus> {
		try {
			await api.post<{ access?: string; username?: string }>(`${API_PROFILE}?q=${username}`, {
				username: values.username,
			});
			const accessToken = getAccessToken();
			if (accessToken) {
				setAuth(accessToken, {
					username: values.username.trim(),
					email: user?.email,
				});
			}
			return { valid: true };
		} catch (error) {
			return { valid: false, msg: getErrorMessage(error, "Change failed.") };
		}
	}

	async function handleChangeEmail(values: Record<string, string>): Promise<IEventStatus> {
		try {
			await api.post<{ access?: string; email?: string }>(`${API_PROFILE}?q=${username}`, {
				email: values.email,
			});
			const accessToken = getAccessToken();
			if (accessToken) {
				setAuth(accessToken, {
					username: user?.username ?? username ?? "",
					email: values.email.trim(),
				});
			}
			return { valid: true };
		} catch (error) {
			return { valid: false, msg: getErrorMessage(error, "Change failed.") };
		}
	}

	async function handleChangePassword(values: Record<string, string>): Promise<IEventStatus> {
		try {
			await api.post<{ description?: string }>(`${API_PROFILE}?q=${username}`, {
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
			});
			return { valid: true };
		} catch (error) {
			return { valid: false, msg: getErrorMessage(error, "Change failed.") };
		}
	}

	async function handleDeleteAccount(_: Record<string, string>): Promise<IEventStatus> {
		alert("Coming soon");
		return { valid: true };
	}

	const handlePanel = (panel: string) => (_: SyntheticEvent, isExpanded: boolean) => {
		setExpanded(isExpanded ? panel : false);
	};

	return (
		<div>
			<Accordion expanded={expanded === "username"} onChange={handlePanel("username")}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<CTitle size="sm">CHANGE_USERNAME</CTitle>
				</AccordionSummary>
				<AccordionDetails>
					<CForm
						submitText="CHANGE"
						submittingText="CHANGING"
						fields={usernameFields}
						onSubmit={handleChangeUsername}
					/>
				</AccordionDetails>
			</Accordion>
			<Accordion expanded={expanded === "email"} onChange={handlePanel("email")}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<CTitle size="sm">CHANGE_EMAIL</CTitle>
				</AccordionSummary>
				<AccordionDetails>
					<CForm
						submitText="CHANGE"
						submittingText="CHANGING"
						fields={emailFields}
						onSubmit={handleChangeEmail}
					/>
				</AccordionDetails>
			</Accordion>
			<Accordion expanded={expanded === "password"} onChange={handlePanel("password")}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<CTitle size="sm">CHANGE_PASSWORD</CTitle>
				</AccordionSummary>
				<AccordionDetails>
					<CForm
						submitText="CHANGE"
						submittingText="CHANGING"
						fields={passwordFields}
						onSubmit={handleChangePassword}
					/>
				</AccordionDetails>
			</Accordion>
			<Accordion expanded={expanded === "delete"} onChange={handlePanel("delete")}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<CTitle size="sm">DELETE_ACCOUNT</CTitle>
				</AccordionSummary>
				<AccordionDetails>
					<CForm
						submitText="DELETE"
						submittingText="DELETING"
						fields={deleteFields}
						onSubmit={handleDeleteAccount}
					/>
				</AccordionDetails>
			</Accordion>
		</div>
	);
};

export default PProfileSettingsPanel;
