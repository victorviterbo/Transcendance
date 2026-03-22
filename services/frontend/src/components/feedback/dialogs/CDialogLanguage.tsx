import { useState } from "react";
import CButtonLanguage from "../../inputs/buttons/CButtonLanguage";
import CDialog, { type CDialogProps } from "./CDialog";
import CRadioGroup from "../../inputs/radio/CRadioGroup";
import { Box } from "@mui/material";
import { currentLang, onLangChanged } from "../../../localization/localization";
import CDialogTitle from "./CDialogTitle";

export interface CDialogLanguageProps extends CDialogProps {}

function CDialogLanguage({ open, ...other }: CDialogLanguageProps) {
	//====================== STATE ======================
	const [isOpen, setIsOpen] = useState<boolean>(open);
	const [currentLangState, setCurrentLangState] = useState<string>(currentLang);

	//====================== DOM ======================
	return (
		<>
			<CButtonLanguage onClick={() => setIsOpen(true)} />
			<CDialog
				open={isOpen}
				onClose={() => {
					onLangChanged(currentLangState);
					setIsOpen(false);
				}}
				{...other}
			>
				<Box>
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
				</Box>
			</CDialog>
		</>
	);
}

export default CDialogLanguage;
