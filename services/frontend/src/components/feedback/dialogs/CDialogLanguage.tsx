import { useState } from "react";
import CButtonLanguage from "../../inputs/buttons/CButtonLanguage";
import CDialog, { type CDialogProps } from "./CDialog";
import CRadioGroup from "../../inputs/radio/CRadioGroup";
import CButtonText from "../../inputs/buttons/CButtonText";
import { Stack, DialogActions } from "@mui/material";
import { currentLang, onLangChanged } from "../../../localization/localization";
import CDialogTitle from "./CDialogTitle";

export interface CDialogLanguageProps extends CDialogProps {}

function CDialogLanguage({ open, ...other }: CDialogLanguageProps) {
	//====================== STATE ======================
	const [isOpen, setIsOpen] = useState<boolean>(open);
	const [currentLangState, setCurrentLangState] = useState<string>(currentLang);

	function onClose() {
		onLangChanged(currentLangState);
		setIsOpen(false);
	}

	//====================== DOM ======================
	return (
		<>
			<CButtonLanguage onClick={() => setIsOpen(true)} />
			<CDialog open={isOpen} onClose={onClose} {...other}>
				<Stack spacing={2} alignItems="center" sx={{ pt: 1 }}>
					<CDialogTitle>LANG_SELECT</CDialogTitle>
					<CRadioGroup
						defaultValue={currentLangState}
						options={[
							{ value: "en", label: "English" },
							{ value: "fr", label: "Français" },
							{ value: "jp", label: "日本語" },
						]}
						onChange={(_, value) => {
							setCurrentLangState(value);
						}}
					/>
					<DialogActions sx={{ px: 0, pb: 0, pt: 1 }}>
						<CButtonText onClick={onClose}>SAVE</CButtonText>
					</DialogActions>
				</Stack>
			</CDialog>
		</>
	);
}

export default CDialogLanguage;
