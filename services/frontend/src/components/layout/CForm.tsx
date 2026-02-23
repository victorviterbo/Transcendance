import { Box, capitalize, Typography } from "@mui/material";
import CButton from "../inputs/buttons/CButton.tsx";
import { useMemo, useState, type FormEvent } from "react";
import type { GCompProps } from "../../components/common/GProps.tsx";
import type { IEventStatus } from "../../types/events.tsx";
import type { TConfirmConfig, TFormFieldConfig } from "../../types/form.ts";
import CTextField from "../inputs/textFields/CTextField.tsx";

interface CFormProps extends GCompProps {
	submitText: string;
	submittingText?: string;
	fields: TFormFieldConfig[];
	onSubmit?: (values: Record<string, string>) => Promise<IEventStatus>;
}

interface IFieldSpec extends TFormFieldConfig {
	confirmOf?: string;
	confirmError?: string;
}

/**
 * @brief confirm might be true, an object or undefined. This function turns it into a standard
 * object (or null if no confirm).
 * @param confirm confirm field to normalize
 * @returns normalized confirm
 */
const normalizeConfirm = (confirm: TFormFieldConfig["confirm"]): TConfirmConfig | null => {
	if (!confirm) return null;
	if (confirm === true) return {};
	return confirm;
};

function CForm({ submitText, submittingText, fields, onSubmit }: CFormProps) {
	//====================== MEMOS ======================
	const { specs, specByName, confirmByOriginal } = useMemo(() => {
		const nextSpecs: IFieldSpec[] = [];
		const specMap = new Map<string, IFieldSpec>();
		const confirmMap = new Map<string, string>();

		fields.forEach((field) => {
			const baseSpec: IFieldSpec = { ...field };
			nextSpecs.push(baseSpec);
			specMap.set(field.name, baseSpec);
			const confirm = normalizeConfirm(field.confirm);
			if (confirm) {
				const confirmName = confirm.name ?? `confirm${capitalize(field.name)}`;
				const confirmLabel = confirm.label ?? `Confirm ${field.label}`;
				const confirmSpec: IFieldSpec = {
					name: confirmName,
					label: confirmLabel,
					type: field.type,
					required: confirm.required ?? field.required,
					confirmOf: field.name,
					confirmError: confirm.error ?? `${field.label} does not match`,
				};
				nextSpecs.push(confirmSpec);
				specMap.set(confirmName, confirmSpec);
				confirmMap.set(field.name, confirmName);
			}
		});

		return { specs: nextSpecs, specByName: specMap, confirmByOriginal: confirmMap };
	}, [fields]);

	const initialValues = useMemo(() => {
		const entries = specs.map((spec) => [spec.name, spec.initialValue ?? ""]);
		return Object.fromEntries(entries) as Record<string, string>;
	}, [specs]);

	const initialErrors = useMemo(() => {
		const entries = specs.map((spec) => [spec.name, [] as string[]]);
		return Object.fromEntries(entries) as Record<string, string[]>;
	}, [specs]);

	//====================== STATE ======================
	const [formState, setFormState] = useState(() => ({
		values: initialValues,
		errors: initialErrors,
	}));
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [formError, setFormError] = useState<string | null>(null);

	//====================== FUNCTIONS ======================
	const runValidate = (spec: IFieldSpec, value: string, values: Record<string, string>) => {
		const errors: string[] = [];
		if (spec.validate) errors.push(...spec.validate(value, values));
		if (spec.confirmOf) {
			if (value.length === 0) return errors;
			const original = values[spec.confirmOf] ?? "";
			if (value !== original) errors.push(spec.confirmError ?? "Does not match");
		}
		return errors;
	};

	const setField = (name: string, value: string) => {
		setFormState((prev) => {
			const nextValues = { ...prev.values, [name]: value };
			const nextErrors = { ...prev.errors };
			const spec = specByName.get(name);
			if (spec) nextErrors[name] = runValidate(spec, value, nextValues);
			const confirmName = confirmByOriginal.get(name);
			if (confirmName) {
				const confirmSpec = specByName.get(confirmName);
				if (confirmSpec) {
					nextErrors[confirmName] = runValidate(
						confirmSpec,
						nextValues[confirmName] ?? "",
						nextValues,
					);
				}
			}
			return { values: nextValues, errors: nextErrors };
		});
	};

	const validateAll = () => {
		const nextErrors: Record<string, string[]> = {};
		specs.forEach((spec) => {
			const value = formState.values[spec.name] ?? "";
			if (spec.required && value.trim().length === 0) {
				nextErrors[spec.name] = ["Please fill this"];
				return;
			}
			nextErrors[spec.name] = runValidate(spec, value, formState.values);
		});
		const hasErrors = Object.values(nextErrors).some((errors) => errors.length > 0);
		if (hasErrors) {
			setFormState((prev) => ({ ...prev, errors: nextErrors }));
			return false;
		}
		return true;
	};

	const setBackendErrors = (fieldErrors: Record<string, string | string[]>) => {
		setFormState((prev) => {
			const nextErrors = { ...prev.errors };
			Object.entries(fieldErrors).forEach(([key, value]) => {
				if (!(key in nextErrors)) return;
				nextErrors[key] = Array.isArray(value) ? value : [value];
			});
			return { ...prev, errors: nextErrors };
		});
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

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		setFormError(null);
		if (onSubmit) {
			const valid = validateAll();
			if (!valid) {
				setIsSubmitting(false);
				return;
			}
			onSubmit(formState.values)
				.then((retStatus) => {
					if (!retStatus) return;
					if (retStatus.valid) {
						setFormError(null);
						return;
					}
					if (retStatus.fieldErrors) setBackendErrors(retStatus.fieldErrors);
					setFormError(retStatus.msg ?? null);
				})
				.finally(() => {
					setIsSubmitting(false);
				});
			return;
		}
		setIsSubmitting(false);
	}

	//====================== DOM ======================
	return (
		<Box component="form" onSubmit={handleSubmit} noValidate>
			{specs.map((spec) => {
				const fieldErrors = formState.errors[spec.name] ?? [];
				return (
					<CTextField
						key={spec.name}
						label={spec.label}
						name={spec.name}
						type={spec.type}
						fullWidth
						margin="normal"
						value={formState.values[spec.name] ?? ""}
						error={Boolean(fieldErrors.length)}
						helperText={renderErrors(fieldErrors)}
						onChange={(event) => setField(spec.name, event.target.value)}
						slotProps={{ formHelperText: { component: "div" } }}
					/>
				);
			})}

			{formError && (
				<Typography color="error" variant="body2" sx={{ mt: 1 }}>
					{formError}
				</Typography>
			)}

			<CButton
				type="submit"
				variant="contained"
				fullWidth
				sx={{ mt: 2 }}
				disabled={isSubmitting}
			>
				{isSubmitting ? (submittingText ? submittingText : submitText) : submitText}
			</CButton>
		</Box>
	);
}

export default CForm;
