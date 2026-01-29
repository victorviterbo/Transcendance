import { Box, Button, Typography } from "@mui/material";
import { useState, type FormEvent, type ReactNode } from "react";
import type { GCompProps } from "../../components/common/GProps.tsx";
import type { IEventStatus } from "../../types/events.tsx";

interface CFormProps extends GCompProps {
	//DATA
	submitText: string;
	submittingText?: string;

	//DOM
	children?: ReactNode;

	//EVENTS
	onSubmit?: () => Promise<IEventStatus>;
}

function CForm({ submitText, submittingText, children, onSubmit }: CFormProps) {
	//====================== STATE ======================
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<IEventStatus | null>(null);

	//====================== FUNCTIONS ======================
	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		if (onSubmit) {
			onSubmit()
				.then((retStatus) => {
					setError(retStatus);
				})
				.finally(() => {
					setIsSubmitting(false);
				});
		}
	}

	//====================== DOM ======================
	//TODO: change Typography and button
	return (
		<Box component="form" onSubmit={handleSubmit}>
			{children}

			{error && !error.valid && error.msg && (
				<Typography color="error" variant="body2" sx={{ mt: 1 }}>
					{error.msg}
				</Typography>
			)}

			<Button
				type="submit"
				variant="contained"
				fullWidth
				sx={{ mt: 2 }}
				disabled={isSubmitting}
			>
				{isSubmitting ? (submittingText ? submittingText : submitText) : submitText}
			</Button>
		</Box>
	);
}

export default CForm;
