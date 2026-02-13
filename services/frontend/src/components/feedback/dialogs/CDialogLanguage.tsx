import { useState } from "react";
import CButtonLanguage from "../../inputs/buttons/CButtonLanguage";
import CDialog, { type CDialogProps } from "./CDialog";
import CRadioGroup from "../../inputs/radio/CRadioGroup";
import { Box, DialogContent, DialogTitle } from "@mui/material";
import { tr_currentLang, tr_onLangChanged, ttr } from "../../../localization/localization";

export interface CDialogLanguageProps extends CDialogProps {
	
}

function CDialogLanguage({open, ...other}: CDialogLanguageProps) {
	
	//====================== STATE ======================
	var [isOpen, setIsOpen] = useState<boolean>(open);
	var [currentLang, setCurrentLang] = useState<string>(tr_currentLang);

	//====================== DOM ======================
	return <>
		<CButtonLanguage onClick={() => setIsOpen(true)}/>
		<CDialog open={isOpen} onClose={() => {
			tr_onLangChanged(currentLang);
			setIsOpen(false);
		}} {...other}>
			<DialogContent>
				<Box>
					<DialogTitle>{ttr("LANG_SELECT")}</DialogTitle>
					<CRadioGroup defaultValue={currentLang} options={[
						{value: "en", label:"English"},
						{value: "fr", label:"Français"},
						{value: "jp", label:"日本語"},
					]} onChange={(_, value) => {
						setCurrentLang(value);	
					}}/>
				</Box>
			</DialogContent>
		</CDialog>
	</>
}

export default CDialogLanguage;